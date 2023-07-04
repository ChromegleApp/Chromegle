class IPGrabberManager extends Module { // todo remove extra references

    GEO_MAPPINGS = {
        country: "Country",
        region: "Region",
        city: "City",
        organization: "Provider"
    }

    ENABLE_TAG = "Show IP-Address";
    DISABLE_TAG = "Hide IP-Address";
    ipGrabberDiv = undefined;
    request = undefined;
    languages = null;

    constructor() {
        super();
        this.addEventListener("createAddressContainer", this.onDisplayScrapeData, undefined, window);
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
        $.getJSON(getResourceURL("public/languages.json"),  (json) => this.languages = json);
    }

    getFlagEmoji(countryCode) {
        String.fromCodePoint(...[...countryCode.toUpperCase()].map(x => 0x1f1a5 + x.charCodeAt(undefined)));
    }

    onDisplayScrapeData(event) {

        // Must be chatting
        if (!ChatRegistry.isChatting()) {
            return;
        }

        let unhashedAddress = event["detail"];
        let scrapeQuery = {[config.ipGrabToggle.getName()]: config.ipGrabToggle.getDefault()};

        // Check if show data is enabled, hash the address, run through block manager
        chrome.storage.sync.get(scrapeQuery, (result) => {
            let showData = result[config.ipGrabToggle.getName()] === "true";
            sha1(unhashedAddress).then((hashedAddress) => {
                Logger.DEBUG("Scraped IP Address from video chat | Hashed: <%s> Raw: <%s>", hashedAddress, unhashedAddress);
                IPBlockingManager._receivedAddress(unhashedAddress, hashedAddress, (skippedChat) => {
                        if (skippedChat) return;
                        this.onIPBlockedCallback(showData, unhashedAddress, hashedAddress);
                    })
                }
            );
        })

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

    onIPBlockedCallback(showData, unhashedAddress, hashedAddress) {
        let previousQuery = {"PREVIOUS_HASHED_ADDRESS_LIST": {}};
        chrome.storage.local.get(previousQuery, (result) => {
            const previouslyHashed = result["PREVIOUS_HASHED_ADDRESS_LIST"];
            const seenTimes = previouslyHashed[hashedAddress] || 0;
            this.sendChatSeenEvent(seenTimes, unhashedAddress);
            this.createAddressContainer(unhashedAddress, hashedAddress, previouslyHashed, showData, seenTimes);

            // Update times seen
            previouslyHashed[hashedAddress] = seenTimes + 1;
            chrome.storage.local.set({"PREVIOUS_HASHED_ADDRESS_LIST": previouslyHashed}).then();

            // Geolocation request
            fetchWithTimeout(
                `${ConstantValues.apiURL}geolocate?chromegler=true&address=${unhashedAddress}`,
                {timeout: 5000}
            )
                .then((res) => res.json())
                .then((json) => this.onGeolocationRequestCompleted(unhashedAddress, json))
                .catch(() => this.onGeolocationRequestError(unhashedAddress));
        });
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

        const plural = seenTimes > 1 ? "s" : "";
        seenBeforeDiv.appendChild(
            $(`<span class='statuslog'>You've seen this person ${seenTimes} time${plural} before.</span>`).get(0)
        );

        Buttons.ipToggleButton.html(showData ? this.DISABLE_TAG : this.ENABLE_TAG);
        innerLogBox.appendChild(Buttons.ipToggleButton.get(0));
        innerLogBox.appendChild(this.ipGrabberDiv);
        innerLogBox.append(seenBeforeDiv);

    }

    insertUnhashedAddress(unhashedAddress) {
        let ipMessage = this.createLogBoxMessage(
            "IP Address: ", unhashedAddress
        );
        ipMessage.appendChild(Buttons.ipBlockButton(unhashedAddress));
        this.ipGrabberDiv.appendChild(ipMessage); // Add the IP first
    }

    onGeolocationRequestError(unhashedAddress) {
        this.insertUnhashedAddress(unhashedAddress);
        ChatManager.sendErrorMessage("Geolocation failed, try again later or contact us through our discord on the home page!");
    }

    handleBlockedCountries(countrySkipEnabled) {
        const countrySkipInfo = config.countrySkipInfo.getLocalValue().toUpperCase().includes()

        if (!countrySkipEnabled) {
            return;
        }



        let code = geoData["country_code"] || geoData["country_code3"];
        if (config.countrySkipInfo.getLocalValue().toUpperCase().includes(code)) {
            setTimeout(() => {
                AutoSkipManager.skipIfPossible();
            }, Math.floor(Math.random() * 1000) + 50)
            Logger.INFO("Detected user from blocked country in chat with UUID <%s>, skipped.", ChatRegistry.getUUID());
            ChatManager.sendErrorMessage(
                `Detected user from blocked country ${geoData["country"]} (${code}), skipped chat.`
            );
        }
    }
    onGeolocationRequestCompleted(unhashedAddress, geoJSON) {
        this.insertUnhashedAddress(geoJSON?.ip || unhashedAddress);

        const countrySkipEnabled = config.countrySkipToggle.getLocalValue() === "true";
        const mappingKeys = Object.keys(this.GEO_MAPPINGS);
        const geoDataKeys = Object.keys(geoJSON);

        // Handle blocked countries
        if (this.handleBlockedCountries(countrySkipEnabled)) {
            return;
        }

        // Skip blocked countries
        if (config.countrySkipToggle.getLocalValue() === "true" && (geoDataKeys.includes("country_code") || geoDataKeys.includes("country_code3"))) {


        }

        // Handle case where owner found
        if (geoData?.["owner"]) IPGrabberManager.insertOwnerMessage();

        // Log information
        Logger.DEBUG(
            "Received IP Scraping data for chat UUID <%s> from the Chromegle web-server as the following JSON payload: \n\n%s",
            ChatRegistry.getUUID(),
            JSON.stringify(geoData, null, 2)
        );

        // Hardcoded -> If there is longitude and latitude included, add that too
        if (geoDataKeys.includes("longitude") && geoDataKeys.includes("latitude")) {

            IPGrabberManager.ipGrabberDiv.appendChild(
                IPGrabberManager.createLogBoxMessage(
                    "Coordinates: ",

                    `
<span>${geoData["longitude"]}/${geoData["latitude"]}</span>
<a href='https://maps.google.com/maps?q=${geoData["latitude"]},${geoData["longitude"]}' target="_blank">(Google Maps)</a>
`
                    ,
                    "long_lat_data"
                )
            );
        }

        // Iterate through the JSON data received from the API, map the strings
        geoDataKeys.forEach(function (key) {
            const entry = geoData[key];
            if (mappingKeys.includes(key) && !((entry == null) || entry === ''))
                IPGrabberManager.ipGrabberDiv.appendChild(
                    IPGrabberManager.createLogBoxMessage(IPGrabberManager.GEO_MAPPINGS[key] + ": ", entry, key + "_data")
                );
        });

        // Hardcoded -> If there is accuracy data, add that too
        if (geoDataKeys.includes("accuracy")) {
            IPGrabberManager.ipGrabberDiv.appendChild(
                IPGrabberManager.createLogBoxMessage(
                    "Accuracy: ",
                    `${geoData["accuracy"]} km radius`
                    , "accuracy_data")
            );
        }

        // Hardcoded -> If there is a country code && country name, add that
        if (geoDataKeys.includes("country_code") && geoDataKeys.includes("country")) {
            const countrySpan = $(
                `<span>  <span class='flagText nceFont'>${IPGrabberManager.getFlagEmoji(geoData["country_code"])}</span></span>`
            ).get(0)
            $("#country_data").get(0).appendChild(countrySpan);
        }

        // Hardcoded -> If there is a language, add that
        if (IPGrabberManager.languages != null && geoDataKeys.includes("country_code")) {
            let languages = IPGrabberManager.languages?.[geoData?.["country_code"]]?.join(", ") || null;
            if (languages != null) {
                IPGrabberManager.ipGrabberDiv.appendChild(
                    IPGrabberManager.createLogBoxMessage(
                        "Language(s): ", languages, "language_data")
                );
            }
        }


        // Hardcoded -> Local time
        if (geoDataKeys.includes("timezone")) {
            const element_id = "local_time_data"

            IPGrabberManager.ipGrabberDiv.appendChild(
                IPGrabberManager.createLogBoxMessage(
                    "Local Time: ",
                    IPGrabberManager.getCurrentTime(geoData["timezone"]),
                    element_id
                )
            );

            setTimeout(() => {
                IPGrabberManager.updateElementLoop(ChatRegistry.getUUID(), geoData["timezone"], `#${element_id}`,
                    (timezone) => IPGrabberManager.getCurrentTime(timezone));
            }, 5);

        }

        // Hardcoded -> Elapsed time since in call with peer
        const element_id = "since_time_data"

        IPGrabberManager.ipGrabberDiv.appendChild(
            IPGrabberManager.createLogBoxMessage(
                "Time in call: ",
                "0:00",
                element_id
            )
        );

        setTimeout(() => {
            var sinceDate = new Date();

            IPGrabberManager.updateElementLoop(ChatRegistry.getUUID(), geoData["timezone"], `#${element_id}`,
                (_) => IPGrabberManager.formatElapsedTime(sinceDate));
        }, 5);

        // Hardcoded -> Are they a Chromegler?
        if (geoData?.["chromegler"]) {
            const logItemDiv = document.createElement("div");
            logItemDiv.classList.add("logitem");
            logItemDiv.appendChild(
                $(
                    `<span class='statuslog' style="color: rgb(32, 143, 254);">This person is also using Chromegle right now!</span>`).get(0)
            );
            document.getElementsByClassName("logitem")[0].parentNode.appendChild(logItemDiv);
        }



    }

    getCurrentTime(timezone) {
        const options = {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }

        return (new Date()).toLocaleString("en-US", options);
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


    updateElementLoop(cachedUUID, timezone, elementSelector, textFunc, interval = 1000) {	
        if (cachedUUID !== ChatRegistry.getUUID()) return;	
        $(elementSelector).get(0).childNodes[1].innerHTML = textFunc(timezone);	
        setTimeout(() => IPGrabberManager.updateElementLoop(cachedUUID, timezone, elementSelector, textFunc), interval);	
    },

    formatElapsedTime(sinceDate) {
        const diff = new Date(new Date() - new Date(sinceDate));

        const hours = diff.getUTCHours();
        const minutes = diff.getUTCMinutes().toString().padStart(2, "0");
        const seconds = diff.getUTCSeconds().toString().padStart(2, "0");

        return `${hours > 0 ? hours + ":" : ""}${minutes}:${seconds}`;
    },

    createLogBoxMessage: (label, value, elementId) => {

        // Create a new container for the entry
        let youMsgClass = document.createElement("p");
        youMsgClass.classList.add("youmsg");
        youMsgClass.id = elementId;

        // Set the field (bolded part)
        let field = document.createElement("strong");
        field.classList.add("statusItem");
        field.innerText = label + "";

        // Set the result (answer part)
        let entry = document.createElement("span")
        entry.innerHTML = value;

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

    _receivedAddress(unhashedAddress, hashedAddress, callback) {

        IPBlockingManager.getStoredChromeConfig((result) => {
            result = result[IPBlockingManager.LOCAL_STORAGE_ID];
            const skipChat = result.includes(unhashedAddress)

            if (skipChat) {
                Logger.INFO("Skipped blocked IP address <%s> with chat UUID <%s>", unhashedAddress, ChatRegistry.getUUID())
                ChatManager.sendErrorMessage(`Skipped the blocked IP address ${unhashedAddress}`)
                    .appendChild(Buttons.ipUnblockButton(unhashedAddress))
                AutoSkipManager.skipIfPossible();
            }

            callback(skipChat);

        });

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



