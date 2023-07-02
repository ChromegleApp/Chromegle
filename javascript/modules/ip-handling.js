const IPGrabberManager = {
    ipGrabberDiv: undefined,
    enableTag: "Show IP-Address",
    disableTag: "Hide IP-Address",
    request: undefined,
    languages: null,

    initialize() {
        window.addEventListener("displayScrapeData", (detail) => IPGrabberManager._displayScrapeData(detail));
        this.loadLanguageList();

        let script = document.createElement('script');
        script.src = chrome.runtime.getURL('/javascript/modules/web-accessible-scripts/scrape-ips.js')
        script.onload = () => {
            script.remove();
            document.dispatchEvent(new CustomEvent('scrapeAddress'))
        };

        (document.head || document.documentElement).appendChild(script);

    },

    loadLanguageList() {
        $.getJSON(getResourceURL("resources/json/languages.json"), function (json) {
            IPGrabberManager.languages = json;
        });
    },


    getFlagEmoji: countryCode => String.fromCodePoint(...[...countryCode.toUpperCase()].map(x => 0x1f1a5 + x.charCodeAt())),

    _displayScrapeData(detail) {

        // Must be chatting
        if (!ChatRegistry.isChatting()) {
            return;
        }

        let scrapeQuery = {}
        scrapeQuery[config.ipGrabToggle.getName()] = config.ipGrabToggle.getDefault();

        chrome.storage.sync.get(scrapeQuery, (result) => {
            sha1(detail["detail"]).then((hashedAddress) => {

                // Skip if blocked
                IPBlockingManager._receivedAddress(detail["detail"], hashedAddress, (skippedChat) => {

                    if (skippedChat) return;

                    let previousQuery = {}
                    previousQuery["PREVIOUS_HASHED_ADDRESS_LIST"] = {};

                    chrome.storage.local.get(previousQuery, (_result) => {
                        const previousHashedAddresses = _result["PREVIOUS_HASHED_ADDRESS_LIST"];
                        const seenTimes = (previousHashedAddresses[hashedAddress] == null) ? 0 : previousHashedAddresses[hashedAddress];
                        document.dispatchEvent(new CustomEvent(
                            "chatSeenTimes",
                            {
                                detail: {
                                    "uuid": ChatRegistry.getUUID(),
                                    "seenTimes": seenTimes,
                                    "ipAddress": detail["detail"]
                                }
                            }
                        ));

                        IPGrabberManager.displayScrapeData(
                            detail["detail"],
                            hashedAddress,
                            previousHashedAddresses,
                            result[config.ipGrabToggle.getName()] === "true",
                            seenTimes
                        );
                    });

                });

            });

        });


    },

    addAddress(unhashedAddress) {
        const ipMessage = IPGrabberManager.createLogBoxMessage("IP Address: ", unhashedAddress)
        ipMessage.appendChild(ButtonManager.ipBlockButton(unhashedAddress))
        IPGrabberManager.ipGrabberDiv.appendChild(ipMessage); // Add the IP first
    },

    displayScrapeData(unhashedAddress, hashedAddress, previousHashedAddresses, showData, seenTimes) {
        Logger.DEBUG("Scraped IP Address from video chat | Hashed: <%s> Raw: <%s>", hashedAddress, unhashedAddress);

        const innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
        const logItemDiv = document.createElement("div");
        const seenBeforeDiv = document.createElement("div")
        IPGrabberManager.ipGrabberDiv = document.createElement("div");

        logItemDiv.classList.add("logitem");
        seenBeforeDiv.classList.add("logitem");
        IPGrabberManager.ipGrabberDiv.classList.add("logitem");

        const plural = seenTimes !== 1 && seenTimes !== "1" ? "s" : "";

        seenBeforeDiv.appendChild($(`<span class='statuslog'>You've seen this person ${seenTimes} time${plural} before.</span>`).get(0));


        previousHashedAddresses[hashedAddress] = seenTimes + 1;
        chrome.storage.local.set({"PREVIOUS_HASHED_ADDRESS_LIST": previousHashedAddresses});

        IPGrabberManager.ipGrabberDiv.style.display = showData ? "" : "none";
        if (showData) ButtonManager.ipToggleButton.html(IPGrabberManager.disableTag);
        else ButtonManager.ipToggleButton.html(IPGrabberManager.enableTag);

        innerLogBox.appendChild(ButtonManager.ipToggleButton.get(0));
        innerLogBox.appendChild(IPGrabberManager.ipGrabberDiv);
        innerLogBox.append(seenBeforeDiv);

        IPGrabberManager.request = new XMLHttpRequest();
        IPGrabberManager.request.timeout = 5000;
        IPGrabberManager.request.open("GET", `${ConstantValues.apiURL}geolocate?chromegler=true&address=${unhashedAddress}`, true);
        IPGrabberManager.request.onreadystatechange = () => IPGrabberManager.displayGeolocation(unhashedAddress);
        IPGrabberManager.request.ontimeout = () => IPGrabberManager.failedGeolocation(unhashedAddress);
        IPGrabberManager.request.send();

    },

    failedGeolocation(unhashedAddress) {
        IPGrabberManager.addAddress(unhashedAddress);
        ChatManager.sendErrorMessage("Geolocation timed out, try again later or contact us through our discord on the home page!");
    },

    geoMappings: {
        country: "Country",
        region: "Region",
        city: "City",
        organization: "Provider"
    },

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
    },

    handleChromegleOwner() {
        Logger.DEBUG("You found the owner of Chromegle!");
        const logItemDiv = document.createElement("div");
        logItemDiv.classList.add("logitem");
        logItemDiv.appendChild(
            $(
                `<img class='owner' alt="owner" src="${ConstantValues.apiURL}users/owner/gif"</img>`
            ).get(0)
        );
        logItemDiv.appendChild(
            $(
                `<span class='statuslog' style="color: rgb(205,141,16);">
                        You found the owner of Chromegle! It's lovely to meet you!
                      </span>`
            ).get(0)
        );
        document.getElementsByClassName("logitem")[0].parentNode.appendChild(logItemDiv);
    },

    displayGeolocation(unhashedAddress) {

        // No request
        if (IPGrabberManager.request == null) {
            IPGrabberManager.addAddress(unhashedAddress);
            return;
        }

        // Request not done yet
        if (!(IPGrabberManager.request.readyState === 4)) {
            return;
        }

        // Parse request text
        let geoData = null;
        try {
            geoData = JSON.parse(IPGrabberManager.request.responseText)
        } catch (ex) {
            IPGrabberManager.addAddress(unhashedAddress);
            ChatManager.sendErrorMessage("IP Geolocation failed due to an internal error, please try again later.")
            return;
        }

        const mappingKeys = Object.keys(IPGrabberManager.geoMappings);

        if (IPGrabberManager.request.status === 200) {
            const geoDataKeys = Object.keys(geoData);
            IPGrabberManager.addAddress(geoData?.ip || unhashedAddress);

            // Skip blocked countries
            if (config.countrySkipToggle.getLocalValue() === "true" && (geoDataKeys.includes("country_code") || geoDataKeys.includes("country_code3"))) {
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

            // Handle case where owner found
            if (geoData?.["owner"]) IPGrabberManager.handleChromegleOwner();

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
                        IPGrabberManager.createLogBoxMessage(IPGrabberManager.geoMappings[key] + ": ", entry, key + "_data")
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

    },

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
                    .appendChild(ButtonManager.ipUnblockButton(unhashedAddress))
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
                ).appendChild(ButtonManager.ipUnblockButton(unhashedAddress));
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
        $(IPBlockingMenu.settingsModal).load(getResourceURL("resources/html/blocked.html"));
        $("html").append(IPBlockingMenu.settingsModal)
    },

    _modifyIfEmpty(size) {
        if (size > 0) return;

        $(".ipListTable").get(0).appendChild($(`

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
        settingsManager.disable();
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



