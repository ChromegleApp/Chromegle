const StatTrackManager = {

    queue: [],

    queueStat(action) {
        StatTrackManager.queue.push([action, Math.floor(Date.now() / 1000)]);
    },

    initialize() {
        StatTrackManager.queueStat("omegleOpened");
        document.addEventListener("chatStarted", () => StatTrackManager.queueStat("chatStarted"));
        document.addEventListener("chatEnded", () => StatTrackManager.queueStat("chatEnded"));
        window.addEventListener("beforeunload", () => StatTrackManager.sendStats(true));
        setTimeout(() => StatTrackManager.statLoop(), 1000);
    },

    statLoop() {

        if (StatTrackManager.queue.length > 0) {
            StatTrackManager.sendStats();
        }

        setTimeout(StatTrackManager.statLoop, 30000);
    },

    sendStats(beacon = false) {
        const xhr = new XMLHttpRequest();
        let stats = JSON.stringify({"stats": StatTrackManager.queue, "beacon": beacon});

        if (beacon) {
            navigator.sendBeacon(`${ConstantValues.apiURL}/chromegle/stats/bulk`, new Blob([JSON.stringify(stats)], {type: 'text/plain'}))
            StatTrackManager.queue = [];
            return;
        }

        // Send Stats
        xhr.open('POST', `${ConstantValues.apiURL}/chromegle/stats/bulk`);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(stats);

        // Clear queue if sent successfully
        xhr.onreadystatechange = () => {
            if (xhr == null || !(xhr.readyState === 4)) return;
            if (xhr.status === 200) {
                StatTrackManager.queue = [];
            }
        }
    }

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
