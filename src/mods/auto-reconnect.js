
class ReconnectManager extends Module {

    RECONNECT_TYPES = {
        TEXT_CHAT: "1",
        VIDEO_CHAT: "2",
        BOTH: "3"
    }

    async onChatEnded() {

        if (!await this.shouldReconnect()) {
            return;
        }

        AutoSkipManager.startIfPossible();
    }

    async shouldReconnect() {
        let autoReconnectEnabled = await config.autoReconnectToggle.retrieveValue();
        let autoReconnectType = await config.autoReconnectType.retrieveValue();

        // Has to be enabled
        if (!(autoReconnectEnabled === "true")) {
            return false;
        }

        // Cases to reconnect
        let reconnectCases = [
            autoReconnectType === this.RECONNECT_TYPES.BOTH,
            (ChatRegistry.isTextChat() && autoReconnectType === this.RECONNECT_TYPES.TEXT_CHAT),
            (ChatRegistry.isVideoChat() && autoReconnectType === this.RECONNECT_TYPES.VIDEO_CHAT)
        ]

        // If ANY are true
        return reconnectCases.some(i => i);

    }

}
