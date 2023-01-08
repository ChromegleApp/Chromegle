const ReconnectTypes = {
    TEXT_CHAT: "1",
    VIDEO_CHAT: "2",
    BOTH: "3"
}

const ReconnectManager = {
    initialize: () => ReconnectManager._chatEnded(),
    _chatEnded() {
        document.addEventListener("chatEnded", (event) => {

            let reconnectQuery = {};
            reconnectQuery[config.autoReconnectToggle.getName()] = config.autoReconnectToggle.getDefault();
            reconnectQuery[config.autoReconnectType.getName()] = config.autoReconnectType.getDefault();

            chrome.storage.sync.get(reconnectQuery, (result) => {

                // Must be enabled
                if (!(result[config.autoReconnectToggle.getName()] === "true")) {
                    return;
                }

                // Match Chat Type
                if (
                    (result[config.autoReconnectType.getName()] === ReconnectTypes.BOTH) || // Both Enabled
                    ((!ChatRegistry.isVideoChat()) && (result[config.autoReconnectType.getName()] === ReconnectTypes.TEXT_CHAT)) || // Text Enabled
                    (ChatRegistry.isVideoChat() && (result[config.autoReconnectType.getName()] === ReconnectTypes.VIDEO_CHAT)) // Video Enabled
                )
                    setTimeout(() => {
                        $(".disconnectbtn").trigger("click");
                    }, 25);

            });

        });
    }
}
