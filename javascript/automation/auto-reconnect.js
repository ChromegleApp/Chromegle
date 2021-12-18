document.addEventListener("chatEnded", () => {

    const isVideo = $("#videowrapper").get(0) !== undefined

    if (isVideo) {
        return;
    }

    let reconnectQuery = {};
    reconnectQuery[config.autoReconnectToggle.getName()] = config.autoReconnectToggle.getDefault();

    chrome.storage.sync.get(reconnectQuery, (result) => {

        if (result[config.autoReconnectToggle.getName()] === "true") {
            $(".disconnectbtn").trigger("click");
        }
    });

});
