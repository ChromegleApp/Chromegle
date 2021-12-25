document.addEventListener("startUpEvent",() => {

    let script = document.createElement('script');
    script.src = chrome.runtime.getURL('/javascript/automation/web-accessible-scripts/scrape-ips.js')
    script.onload = () => {script.remove(); document.dispatchEvent(new CustomEvent('scrapeAddress'))};
    (document.head || document.documentElement).appendChild(script);

});

window.addEventListener("displayScrapeData", (detail) => {

    // Must be chatting
    if (!ChatRegistry.isChatting()) {
        return;
    }

    let scrapeQuery = {}
    scrapeQuery[config.ipGrabToggle.getName()] = config.ipGrabToggle.getDefault();
    scrapeQuery[config.geoLocateToggle.getName()] = config.geoLocateToggle.getDefault();

    chrome.storage.sync.get(scrapeQuery, (result) => {
        sha1(detail["detail"]).then((hashedAddress) => {

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

                displayScrapeData(
                    detail["detail"],
                    hashedAddress,
                    previousHashedAddresses,
                    result[config.ipGrabToggle.getName()] === "true",
                    result[config.geoLocateToggle.getName()] === "true",
                    seenTimes
                );
            })

        });

    });


});


let ipGrabberDiv = undefined;
const enableTag = "Show IP-Address"
const disableTag = "Hide IP-Address"
const geoMappings = {
    country_name: "Country",
    region_name: "Region",
    city: "City",
    zip_code: "Zip Code"
}
let request = undefined;

function displayScrapeData(unhashedAddress, hashedAddress, previousHashedAddresses, showData, geoLocate, seenTimes) {

    Logger.DEBUG("Scraped IP Address from video chat | Hashed: <%s> Raw: <%s>", hashedAddress, unhashedAddress);

    const innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
    const logItemDiv = document.createElement("div");
    const seenBeforeDiv = document.createElement("div")
    ipGrabberDiv = document.createElement("div");

    logItemDiv.classList.add("logitem");
    seenBeforeDiv.classList.add("logitem");
    ipGrabberDiv.classList.add("logitem");

    const plural = seenTimes !== 1 && seenTimes !== "1" ? "s" : "";

    seenBeforeDiv.appendChild($(`<span class='statuslog'>You've seen this person ${seenTimes} time${plural} before.</span>`).get(0));
    ipGrabberDiv.appendChild(createLogBoxMessage("IP Address: ", unhashedAddress)); // Add the IP first
    if (!geoLocate) ipGrabberDiv.appendChild(createLogBoxMessage("Location: ", "Disabled (Enable in Settings)"))

    previousHashedAddresses[hashedAddress] = seenTimes + 1;
    chrome.storage.local.set({"PREVIOUS_HASHED_ADDRESS_LIST": previousHashedAddresses});

    ipGrabberDiv.style.display = showData ? "" : "none";
    if (showData) ButtonManager.ipToggleButton.html(disableTag);
    else ButtonManager.ipToggleButton.html(enableTag);

    innerLogBox.appendChild(ButtonManager.ipToggleButton.get(0));
    innerLogBox.appendChild(ipGrabberDiv);
    innerLogBox.append(seenBeforeDiv);

    if (geoLocate) {
        request = new XMLHttpRequest();
        request.open("GET", ConstantValues.geoLocationEndpoint + unhashedAddress, true);
        request.onreadystatechange = displayGeolocation;
        request.send();
    }

}


function displayGeolocation() {

    if (request == null) return;
    if (!(request.readyState === 4)) return;
    if (request.status === 403) ipGrabberDiv.appendChild(createLogBoxMessage("(Geolocation unavailable, hourly limit reached)", ""));

    const mappingKeys = Object.keys(geoMappings);

    if (request.status === 200) {
        const geoData = JSON.parse(request.responseText);
        const geoDataKeys = Object.keys(geoData);

        // Iterate through the JSON data received from the API, map the strings
        geoDataKeys.forEach(function(key) {
            const entry = geoData[key];
            if (mappingKeys.includes(key) && !((entry == null) || entry === ''))
                ipGrabberDiv.appendChild(createLogBoxMessage(geoMappings[key] + ": ", entry, key + "_data"));
        });

        // Hardcoded -> If there is longitude and latitude included, add that too
        if (geoDataKeys.includes("longitude") && geoDataKeys.includes("latitude")) {
            ipGrabberDiv.appendChild(createLogBoxMessage("Longitude/Latitude: ", geoData["longitude"] + " / " + geoData["latitude"], "long_lat_data"))
        }

        if (geoDataKeys.includes("country_code") && geoDataKeys.includes("country_name")) {
            const countrySpan = $(`<span class='flagText'> ${getFlagEmoji(geoData["country_code"])}</span>`).get(0)
            $("#country_name_data").get(0).appendChild(countrySpan);
        }

    }

}

const getFlagEmoji = countryCode=>String.fromCodePoint(...[...countryCode.toUpperCase()].map(x=>0x1f1a5+x.charCodeAt()))




const createLogBoxMessage = (label, value, elementId) => {

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