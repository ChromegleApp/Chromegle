document.addEventListener("chatEnded", (event) => {

    if (!event["detail"]["isVideoChat"]) {
        return;
    }

    let reconnectQuery = {};
    reconnectQuery[config.autoReconnectToggle.getName()] = config.autoReconnectToggle.getDefault();

    chrome.storage.sync.get(reconnectQuery, (result) => {

        if (result[config.autoReconnectToggle.getName()] === "true") {
            setTimeout(() => {
                $(".disconnectbtn").trigger("click");
            }, 25);
        }
    });

});
