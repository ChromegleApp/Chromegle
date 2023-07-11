class IPGrabberManager extends Module {

    ENABLE_TAG = "Show Chat-Info";
    DISABLE_TAG = "Hide Chat-Info";
    GEO_MAPPINGS = {
        country: "Country",
        region: "Region",
        city: "City",
        organization: "Provider"
    }

    ipGrabberDiv = null;
    updateClock = null;
    languages = null;

    ipToggleButton = $("<button class='ipLookupButton' style='margin-bottom: 8px; margin-top: 6px;'></button>")
        .on('click', () => {

            let showQuery = {}
            showQuery[config.ipGrabToggle.getName()] = config.ipGrabToggle.getDefault();
            chrome.storage.sync.get(showQuery, (result) => {

                const enabled = !(result[config.ipGrabToggle.getName()] === "true");
                this.ipGrabberDiv.style.display = enabled ? "" : "none";

                if (enabled) this.ipToggleButton.html(this.DISABLE_TAG);
                else this.ipToggleButton.html(this.ENABLE_TAG);
                config.ipGrabToggle.update();

            });

        });


    constructor() {
        super();
        this.addEventListener("displayScrapeData", this.onDisplayScrapeData, undefined, window);
        this.loadLanguageList();
        this.injectScrapeScript();
    }

    injectScrapeScript() {
        let script = document.createElement('script');
        script.src = chrome.runtime.getURL('/src/ext/scrape-ips.js')
        script.onload = () => {
            script.remove();
            document.dispatchEvent(new CustomEvent('scrapeAddress'));
        };
        (document.head || document.documentElement).appendChild(script);
    }


    loadLanguageList() {
        $.getJSON(getResourceURL("public/languages.json"), (json) => this.languages = json);
    }

    getFlagEmoji(countryCode) {
        return String.fromCodePoint(...[...countryCode.toUpperCase()].map(x => 0x1f1a5 + x.charCodeAt(undefined)));
    }

    onDisplayScrapeData(event) {

        // Must be chatting
        if (!ChatRegistry.isChatting()) {
            return;
        }

        let unhashedAddress = event["detail"];
        let scrapeQuery = {[config.ipGrabToggle.getName()]: config.ipGrabToggle.getDefault()};

        // Check if show data is enabled, hash the address, run through block manager
        chrome.storage.sync.get(scrapeQuery, async (result) => {
            let showData = result[config.ipGrabToggle.getName()] === "true";
            let hashedAddress = await sha1(unhashedAddress);

            Logger.DEBUG("Scraped IP Address from video chat | Hashed: <%s> Raw: <%s>", hashedAddress, unhashedAddress);
            if (await IPBlockingManager.handleBlockedAddress(unhashedAddress)) {
                return;
            }

            await this.geolocateAndDisplay(showData, unhashedAddress, hashedAddress);

        });

    }

    sendChatSeenEvent(seenTimes, unhashedAddress) {
        document.dispatchEvent(new CustomEvent(
            "chatSeenTimes",
            {
                detail: {
                    "uuid": ChatRegistry.getUUID(),
                    "seenTimes": seenTimes,
                    "ipAddress": unhashedAddress
                }
            }
        ));

    }

    async geolocateAndDisplay(showData, unhashedAddress, hashedAddress) {
        let previousQuery = {"PREVIOUS_HASHED_ADDRESS_LIST": {}};

        let result = await chrome.storage.local.get(previousQuery);

        const previouslyHashed = result["PREVIOUS_HASHED_ADDRESS_LIST"];
        const seenTimes = previouslyHashed[hashedAddress] || 0;
        this.sendChatSeenEvent(seenTimes, unhashedAddress);
        this.createAddressContainer(unhashedAddress, hashedAddress, previouslyHashed, showData, seenTimes);

        // Update times seen
        previouslyHashed[hashedAddress] = seenTimes + 1;
        await chrome.storage.local.set({"PREVIOUS_HASHED_ADDRESS_LIST": previouslyHashed});

        // Geolocation request
        let fetchJson;
        try {
            let fetchResult = await fetchWithTimeout(
                `${ConstantValues.apiURL}geolocate?chromegler=true&address=${unhashedAddress}`,
                {timeout: 5000}
            );
            fetchJson = await fetchResult.json();
        } catch (ex) {
            this.onGeolocationRequestError(unhashedAddress);
            return;
        }

        this.onGeolocationRequestCompleted(unhashedAddress, fetchJson)

    }

    createAddressContainer(unhashedAddress, hashedAddress, previousHashedAddresses, showData, seenTimes) {

        const innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
        const logItemDiv = document.createElement("div");
        const seenBeforeDiv = document.createElement("div")

        this.ipGrabberDiv = document.createElement("div");
        this.ipGrabberDiv.style.display = showData ? "" : "none";

        this.ipGrabberDiv.classList.add("logitem");
        logItemDiv.classList.add("logitem");
        seenBeforeDiv.classList.add("logitem");

        const plural = (seenTimes > 1 || seenTimes === 0) ? "s" : "";
        seenBeforeDiv.appendChild(
            $(`<span class='statuslog'>You've seen this person ${seenTimes} time${plural} before.</span>`).get(0)
        );

        this.ipToggleButton.html(showData ? this.DISABLE_TAG : this.ENABLE_TAG);
        innerLogBox.appendChild(this.ipToggleButton.get(0));
        innerLogBox.appendChild(this.ipGrabberDiv);
        innerLogBox.append(seenBeforeDiv);

    }

    insertUnhashedAddress(unhashedAddress) {
        let ipMessage = this.createLogBoxMessage(
            "address_data", "IP Address: ", new Spoiler(unhashedAddress).get()
        );
        ipMessage.appendChild(Buttons.ipBlockButton(unhashedAddress));
        this.ipGrabberDiv.appendChild(ipMessage); // Add the IP first
    }

    onGeolocationRequestError(unhashedAddress) {
        this.insertUnhashedAddress(unhashedAddress);
        ChatManager.sendErrorMessage("Geolocation failed, try again later or contact us through our discord on the home page!");
    }

    skipBlockedCountries(countrySkipEnabled, geoJSON) {
        const code = geoJSON["country_code"] || geoJSON["country_code3"];

        // Pre-conditions
        if (!countrySkipEnabled || !code) {
            return false;
        }

        // If blocked
        const countryBlocked = config.countrySkipInfo.getLocalValue().toUpperCase().includes(code);
        if (!countryBlocked) {
            return;
        }

        // Skip
        setTimeout(() => AutoSkipManager.skipIfPossible(), Math.floor(Math.random() * 1000) + 50);

        // Log message
        Logger.INFO("Detected user from blocked country in chat with UUID <%s>, skipped.", ChatRegistry.getUUID());
        ChatManager.sendErrorMessage(`Detected user from blocked country ${geoJSON["country"]} (${code}), skipped chat.`);

        return true;
    }

    containsValidKeys(obj, ...keys) {
        let keyList = Object.keys(obj);

        for (let key of keys) {
            if (!keyList.includes(key) || !obj[key] || obj[key] === '') {
                return false;
            }
        }

        return true;

    }

    /**
     *
     * @param unhashedAddress 192.168.0.1 formatted IP
     * @param geoJSON.ip 192.168.0.1 formatted IP
     * @param geoJSON JSON payload from API
     * @param geoJSON.owner true|false Whether owner is there
     * @param geoJSON.chromegler true|false Whether user is Chromegler
     * @param geoJSON.longitude Longitude
     * @param geoJSON.latitude Latitude
     * @param geoJSON.country Country
     * @param geoJSON.country_code CA formatted country code
     * @param geoJSON.accuracy Kilometre accuracy of geolocation
     * @param geoJSON.timezone Request timezone
     */
    onGeolocationRequestCompleted(unhashedAddress, geoJSON) {
        this.insertUnhashedAddress(geoJSON?.ip || unhashedAddress);

        const countrySkipEnabled = config.countrySkipToggle.getLocalValue() === "true";

        // Handle blocked countries
        if (this.skipBlockedCountries(countrySkipEnabled, geoJSON)) {
            return;
        }

        // Log information
        Logger.DEBUG(
            "Received IP Scraping data for chat UUID <%s> from the Chromegle web-server as the following JSON payload: \n\n%s",
            ChatRegistry.getUUID(),
            JSON.stringify(geoJSON, null, 2)
        );

        // Display geolocation-based fields
        this.displayGeolocationFields(geoJSON);

    }

    insertLogboxMessage(elementId, label, ...values) {
        this.ipGrabberDiv.appendChild(
            this.createLogBoxMessage(elementId, label, ...values)
        )
    }

    displayGeolocationFields(geoJSON) {
        this.updateClock = new ChatUpdateClock(ChatRegistry.getUUID(), 1000);

        // Owner message
        if (geoJSON?.owner) {
            this.insertOwnerMessage();
        }

        // If there is longitude and latitude included, add that too
        if (this.containsValidKeys(geoJSON, "longitude", "latitude")) {
            this.insertLogboxMessage(
                "long_lat_data", "Coordinates: ", `${geoJSON.longitude}/${geoJSON.latitude} `,
                `<a href='https://maps.google.com/maps?q=${geoJSON.latitude},${geoJSON.longitude}' target="_blank">(Google Maps)</a>`
            )
        }

        // Automatic geolocation keys
        Object.keys(this.GEO_MAPPINGS).forEach((key) => {
            const entry = geoJSON[key];
            if (!this.containsValidKeys(geoJSON, key)) {
                return;
            }

            this.insertLogboxMessage(
                `${key}_data`, `${this.GEO_MAPPINGS[key]}: `, entry
            );

        });

        // Accuracy Information
        if (this.containsValidKeys(geoJSON, "accuracy")) {
            this.insertLogboxMessage(
                "accuracy_data", "Accuracy: ", `${geoJSON.accuracy} km radius`
            )
        }

        // Country Flag & Languages
        if (this.containsValidKeys(geoJSON, "country_code", "country")) {

            // Country Flag
            $("#country_data").get(0).appendChild(
                $(`<span>
                            <span class='flagText nceFont'>${this.getFlagEmoji(geoJSON.country_code)}</span>
                          </span>
                `).get(0)
            );

            // Languages
            if (this.languages != null) {
                let userLanguages = this.languages[geoJSON.country_code]?.join(", ") || null;
                if (userLanguages != null) {
                    this.insertLogboxMessage(
                        "language_data", "Language(s): ", userLanguages
                    )
                }
            }
        }

        // Local Time
        if (this.containsValidKeys(geoJSON, "timezone")) {
            this.insertLogboxMessage(
                "local_time_data", "Local Time: ", this.getFormattedTime(geoJSON.timezone)
            );

            // Update time for duration of call
            this.updateClock.addUpdate(
                (date) => {
                    $("#local_time_data").get(0).childNodes[1].innerHTML = this.getFormattedTime(geoJSON.timezone, date);
                }
            )

        }

        // Call Time
        {
            this.insertLogboxMessage(
                "call_time_data", "Time In Call: ", "00:00"
            )

            this.updateClock.addUpdate(
                (date, startTime) => {
                    $("#call_time_data").get(0).childNodes[1].innerHTML = this.formatElapsedTime(date, startTime);
                }
            )

        }

        // Chromegle User
        if (this.containsValidKeys("chromegler") && geoJSON.chromegler) {
            let chromegleLogItem = $(`
                <div class="logitem">
                    <span class='statuslog' style="color: rgb(32, 143, 254);">This person is also using Chromegle right now!</span>
                </div>
            `).get(0);

            document.getElementsByClassName("logitem")[0].parentNode.appendChild(chromegleLogItem);
        }

    }

    getFormattedTime(timezone, date = new Date()) {
        const options = {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }

        return date.toLocaleString("en-US", options);
    }

    insertOwnerMessage() {
        Logger.DEBUG("You found the owner of Chromegle!");

        let ownerMessageDiv = $(
            `<div class="logitem">
                        <img class='owner' alt="owner" src="${ConstantValues.apiURL}users/owner/gif"</img>
                        <span class='statuslog' style="color: rgb(205,141,16);">
                            You found the owner of Chromegle! It's lovely to meet you!
                        </span>
                </div>`
        );

        document.getElementsByClassName("logitem")[0].parentNode.appendChild(ownerMessageDiv.get(0));
    }

    formatElapsedTime(currentTime, startTime) {
        const diff = new Date(currentTime - startTime);

        const hours = diff.getUTCHours();
        const minutes = diff.getUTCMinutes().toString().padStart(2, "0");
        const seconds = diff.getUTCSeconds().toString().padStart(2, "0");

        return `${hours > 0 ? hours + ":" : ""}${minutes}:${seconds}`;
    }

    createLogBoxMessage(elementId, label, ...values) {

        // Create a new container for the entry
        let youMsgClass = document.createElement("p");
        youMsgClass.classList.add("youmsg");
        youMsgClass.id = elementId;

        // Set the field (bolded part)
        let field = document.createElement("strong");
        field.classList.add("statusItem");
        field.innerText = label + "";

        // Set the result (answer part)
        let entry = document.createElement("span");
        for (let value of values) {
            if (typeof value === 'string') {
                entry.innerHTML += value;
            } else {
                entry.appendChild(value);
            }
        }

        // Add the status field & entry to the main entry
        youMsgClass.appendChild(field);
        youMsgClass.appendChild(entry);

        return youMsgClass;

    }
}

const IPBlockingManager = {

    LOCAL_STORAGE_ID: "IP_BLOCK_CONFIG",
    DEFAULT_STORAGE_VALUE: [],

    initialize() {
        IPBlockingMenu.initialize()
    },

    async handleBlockedAddress(unhashedAddress) {

        let result = await IPBlockingManager.getStoredChromeConfigAsync();

        result = result[IPBlockingManager.LOCAL_STORAGE_ID];
        const skipChat = result.includes(unhashedAddress)

        if (skipChat) {
            Logger.INFO("Skipped blocked IP address <%s> with chat UUID <%s>", unhashedAddress, ChatRegistry.getUUID())
            ChatManager.sendErrorMessage(`Skipped the blocked IP address ${unhashedAddress}`)
                .appendChild(Buttons.ipUnblockButton(unhashedAddress))
            AutoSkipManager.skipIfPossible();
        }

        return skipChat;

    },

    async getStoredChromeConfigAsync() {
        let blockQuery = {}
        blockQuery[IPBlockingManager.LOCAL_STORAGE_ID] = IPBlockingManager.DEFAULT_STORAGE_VALUE;
        return await chrome.storage.local.get(blockQuery);
    },

    getStoredChromeConfig(callback) {
        let blockQuery = {}
        blockQuery[IPBlockingManager.LOCAL_STORAGE_ID] = IPBlockingManager.DEFAULT_STORAGE_VALUE;
        chrome.storage.local.get(blockQuery, callback);
    },

    setStoredChromeConfig(newConfig) {
        if (newConfig == null) return;

        let blockQuery = {}
        blockQuery[IPBlockingManager.LOCAL_STORAGE_ID] = (newConfig || IPBlockingManager.DEFAULT_STORAGE_VALUE);

        chrome.storage.local.set(blockQuery);
    },

    unblockAddress(unhashedAddress, inChat = true) {
        const confirmUnblock = confirm(`Are you sure you want to unblock ${unhashedAddress}?`);
        if (!confirmUnblock) return false;

        IPBlockingManager.getStoredChromeConfig((result) => {
            result = result[IPBlockingManager.LOCAL_STORAGE_ID];

            if (result.includes(unhashedAddress)) {
                const index = result.indexOf(unhashedAddress);
                if (index > -1) result.splice(index, 1);

                IPBlockingManager.setStoredChromeConfig(result);

                if (inChat) {
                    Logger.INFO("Unblocked IP address <%s> in video chat", unhashedAddress)
                    ChatManager.sendErrorMessage(`Unblocked the IP address ${unhashedAddress} in video chat`
                    );
                }
            } else {
                alert(`The IP address ${unhashedAddress} is not blocked in video chat!`)
            }

        });

        return true;
    },

    blockAddress(unhashedAddress) {
        const confirmBlock = confirm(`Are you sure you want to block ${unhashedAddress}?`);
        if (!confirmBlock) return;

        IPBlockingManager.getStoredChromeConfig((result) => {
            result = result[IPBlockingManager.LOCAL_STORAGE_ID];

            if (!result.includes(unhashedAddress)) {
                result.push(unhashedAddress);
                IPBlockingManager.setStoredChromeConfig(result);

                Logger.INFO("Blocked IP address <%s> in video chat", unhashedAddress)
                ChatManager.sendErrorMessage(
                    `Blocked the IP address ${unhashedAddress}${ChatRegistry.isChatting() ? " and skipped the current chat" : ""}`
                ).appendChild(Buttons.ipUnblockButton(unhashedAddress));
                if (ChatRegistry.isChatting()) {
                    AutoSkipManager.skipIfPossible();
                }
            } else {
                alert(`The IP address ${unhashedAddress} is already blocked in video chat!`)
            }

        });

    }


}


const IPBlockingMenu = {

    settingsModal: undefined,
    settingsModalElementId: "modal-2",

    initialize() {
        IPBlockingMenu.settingsModal = document.createElement("div");
        $(IPBlockingMenu.settingsModal).load(getResourceURL("public/html/blocked.html"));
        $("html").append(IPBlockingMenu.settingsModal)
    },

    _modifyIfEmpty(size) {
        if (size > 0) return;

        $(".ipListTable")?.get(0)?.appendChild($(`

                <tr>
                    <td class="ipListNumber"></td>
                    <td>You have not blocked anyone...</td>
                    <td></td>
                </tr>`).get(0));
    },

    _genEmptyTable() {
        return $(`

                <table class="ipListTable">
                  <tr>
                    <th style="width: 10%;">Number</th>
                    <th>IP Address</th>
                    <th>Action</th>
                  </tr>              
                </table>
`
        );
    },

    _buildEmptyTable(result, ipListTable) {
        for (let i = 0; i < result.length; i++) {

            ipListTable.get(0).appendChild($(`

                <tr>
                    <td class="ipListNumber">${i + 1}.</td>
                    <td>${result[i]}</td>
                    <td><button class="ipListTableUnblockButton" value="${result[i]}">Unblock</button></td>
                </tr>`).get(0))
        }

    },

    _onUnblockButtonClick(event) {
        let confirmed = IPBlockingManager.unblockAddress(event.target.value, false);
        if (!confirmed) return;


        $(event.target).closest("tr").remove();

        let results = $(".ipListTable").find(".ipListNumber");

        results.each((item) => {
            results.get(item).innerHTML = `${item + 1}.`
        });

        Logger.INFO("Unblocked IP address <%s> in video chat", event.target.value)
        IPBlockingMenu._modifyIfEmpty(document.getElementsByClassName("ipListNumber").length);
    },

    unblockAll(noChange) {
        if (noChange) return;

        const confirmUnblock = confirm(`Are you sure you want to unblock all IP addresses?`);
        if (!confirmUnblock) return;

        IPBlockingManager.setStoredChromeConfig([]);

        Logger.INFO("Unblocked all IP addresses in video chat")
        IPBlockingMenu._modifyIfEmpty(document.getElementsByClassName("ipListNumber").length);
    },

    loadMenu(noChange) {

        if (noChange) return;
        Settings.disable();
        IPBlockingMenu.enable();

        IPBlockingManager.getStoredChromeConfig((result) => {
            result = result[IPBlockingManager.LOCAL_STORAGE_ID];
            const ipListTable = IPBlockingMenu._genEmptyTable();
            IPBlockingMenu._buildEmptyTable(result, ipListTable);
            $("#blockedListDiv").get(0).innerHTML = $('<div>').append(ipListTable).html();
            $(".ipListTableUnblockButton").on(
                "click", (event) => IPBlockingMenu._onUnblockButtonClick(event)
            );
            IPBlockingMenu._modifyIfEmpty(result.length);

        });
    },

    enable() {
        MicroModal.show(IPBlockingMenu.settingsModalElementId)
    },

    disable() {
        MicroModal.hide(IPBlockingMenu.settingsModalElementId)
    },

}



