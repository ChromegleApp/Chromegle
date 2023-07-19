class IPGrabberManager extends Module {

    IP_MENU_TOGGLE_ID = "IP_MENU_TOGGLE";
    IP_MENU_TOGGLE_DEFAULT = "true";

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
        .on('click', this.onIpToggleButtonClick.bind(this));

    async onIpToggleButtonClick() {
        let showQuery = {[this.IP_MENU_TOGGLE_ID]: this.IP_MENU_TOGGLE_DEFAULT};
        let result = (await chrome.storage.sync.get(showQuery))[this.IP_MENU_TOGGLE_ID];
        const enabled = !(result === "true");

        // Toggle Menu
        if (enabled) {
            this.ipToggleButton.html(this.DISABLE_TAG);
            this.ipGrabberDiv.style.display = "";
        } else {
            this.ipToggleButton.html(this.ENABLE_TAG);
            this.ipGrabberDiv.style.display = "none";
        }

        // Update Value
        showQuery[this.IP_MENU_TOGGLE_ID] = `${enabled}`;
        await chrome.storage.sync.set(showQuery)
    }

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
        let scrapeQuery = {[this.IP_MENU_TOGGLE_ID]: this.IP_MENU_TOGGLE_DEFAULT};

        // Check if show data is enabled, hash the address, run through block manager
        chrome.storage.sync.get(scrapeQuery, async (result) => {
            let showData = result[this.IP_MENU_TOGGLE_ID] === "true";
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

        await this.onGeolocationRequestCompleted(unhashedAddress, fetchJson, hashedAddress)

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

    insertUnhashedAddress(unhashedAddress, isOwner = false) {
        let ipMessage = this.createLogBoxMessage(
            "address_data", "IP Address: ", new Spoiler(unhashedAddress).get()
        );

        if (!isOwner) {
            ipMessage.appendChild(ButtonFactory.ipBlockButton(unhashedAddress));
        }

        this.ipGrabberDiv.appendChild(ipMessage); // Add the IP first
    }

    onGeolocationRequestError(unhashedAddress) {
        this.insertUnhashedAddress(unhashedAddress);
        sendErrorLogboxMessage("Geolocation failed, try again later or contact us through our discord on the home page!");
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
        sendErrorLogboxMessage(`Detected user from blocked country ${geoJSON["country"]} (${code}), skipped chat.`);

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
     * @param hashedAddress Hashed IP address
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
    async onGeolocationRequestCompleted(unhashedAddress, geoJSON, hashedAddress) {
        this.insertUnhashedAddress(geoJSON?.ip || unhashedAddress, geoJSON?.owner || false);

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
        await this.displayGeolocationFields(geoJSON, hashedAddress);

    }

    insertLogboxMessage(elementId, label, ...values) {
        this.ipGrabberDiv.appendChild(
            this.createLogBoxMessage(elementId, label, ...values)
        )
    }

    reduceData(num) {
        return parseFloat(num).toFixed(2);
    }

    async displayGeolocationFields(geoJSON, hashedAddress) {
        this.updateClock = new ChatUpdateClock(ChatRegistry.getUUID(), 1000);

        // Owner message
        if (geoJSON?.owner) {
            this.insertOwnerMessage();
        }

        // If there is longitude and latitude included, add that too
        // In chat, we display a less specific (rounded to 2 decimals) version, to protect privacy.
        if (this.containsValidKeys(geoJSON, "longitude", "latitude")) {
            this.insertLogboxMessage(
                "long_lat_data", "Coordinates: ", `${this.reduceData(geoJSON.longitude)}/${this.reduceData(geoJSON.latitude)} `,
                `<a class="ipMapsButton" href='https://maps.google.com/maps?q=${geoJSON.latitude},${geoJSON.longitude}' target="_blank">(Google Maps)</a>`
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

        // Note
        if (!geoJSON.owner) {
            let note = new Note();
            await note.setup(hashedAddress);

            this.insertLogboxMessage(
                "profile_note_data", "Note: ", note.element
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
                        <span class='statuslog' style="color: rgb(235 171 21);">
                            You found the developer of Chromegle! It's lovely to meet you!
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
