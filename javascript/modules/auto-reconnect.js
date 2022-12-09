const ReconnectManager = {
    initialize: () => ReconnectManager._chatEnded(),
    _chatEnded() {
        document.addEventListener("chatEnded", (event) => {

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
    }
}
