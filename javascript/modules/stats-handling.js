/**
 * Statistics Tracking
 *
 * Events Tracked:
 *  - Chat Start
 *  - Chat End
 *  - Omegle Open
 *
 *  NO Identifiable data is saved (IP, Location, etc) by the remote server.
 *  See the API receiving these requests at https://github.com/ChromegleApp/ChromegleAPI
 *  Everything is open source so you know how your data is being handled.
 */
{
    function sendStatistic(action) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${ConstantValues.apiURL}/chromegle/stats?action=${action}`);
        xhr.send();
    }

    $(document).on("ready", () => sendStatistic("omegleOpened"));
    document.addEventListener("chatStarted", () => sendStatistic("chatStarted"));
    document.addEventListener("chatEnded", () => sendStatistic("chatEnded"))

}

const StatisticDisplay = {

    initialize() {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `${ConstantValues.apiURL}/chromegle/stats`);
        xhr.onload = StatisticDisplay.parseStatsData;
        xhr.send();
    },

    parseStatsData(data) {
        let json;
        try {
            json = JSON.parse(data.target.responseText);
            Logger.DEBUG("Received Chromegle statistics data on page load event")
            StatisticDisplay.displayStatsImage(json["payload"]["image"]);
            WebRTCLeakHandling.checkLeakStatus(json["payload"]["address"]);
        } catch (ex) {
            Logger.ERROR("Failed to retrieve Chromegle statistics data on page load event: \n\n%s", ex);
        }

    },

    displayStatsImage(image) {
        if (image && image !== "None") {
            $("#menucontainer").append(
                $(`<img class="statsImage noselect" src="data:image/png;base64, ${image}"  alt=""/>`).get(0)
            )
        }
    }

}
