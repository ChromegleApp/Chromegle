
class ReconnectManager extends Module {

    RECONNECT_MESSAGE_ID = "reconnectMessageCountdown";
    RECONNECT_CANCEL_BUTTON_ID = "reconnectMessageCancelButton";
    RECONNECT_SECONDS_ID = "reconnectMessageSeconds";

    RECONNECT_TYPES = {
        TEXT_CHAT: "1",
        VIDEO_CHAT: "2",
        BOTH: "3"
    }

    #cancelledSkip;

    constructor(props) {
        super(props);
        this.addEventListener("click", this.onDocumentClick);
    }

    onDocumentClick(event) {

        if (event.target.id !== this.RECONNECT_CANCEL_BUTTON_ID) {
            return;
        }

        this.#cancelledSkip = true;

        event.target.parentNode.innerHTML = this.getCancelledHTML();
    }

    async onChatEnded() {

        if (!await this.shouldReconnect()) {
            return;
        }

        let reconnectDelay = await config.autoReconnectDelayField.retrieveValue() || 0;
        reconnectDelay < 1 ? AutoSkipManager.startIfPossible() : this.reconnectAnimation(reconnectDelay);

    }

    getCancelledHTML() {

        return `
            Canceled auto-reconnect until your next conversation, enjoy reading over your chat.
        `;
    }

    getReconnectHTML(secondsLeft) {

        return `
            Auto-reconnect is enabled. Reconnecting in 
            <span id="${this.RECONNECT_SECONDS_ID}">${secondsLeft}</span> 
            seconds from now unless you
            <span id="${this.RECONNECT_CANCEL_BUTTON_ID}" class="chromegle-cancel-skip">cancel reconnecting</span>
            for this chat.
        `;

    }

    updateSecondsLeft(secondsLeft) {
        let secondsElement = document.getElementById(this.RECONNECT_SECONDS_ID);
        secondsElement.innerText = secondsLeft;
    }

    reconnectAnimation(reconnectDelay) {

        // Create the element
        let element = sendInfoLogboxMessage(
            this.getReconnectHTML(reconnectDelay), this.RECONNECT_MESSAGE_ID
        );

        this.#cancelledSkip = false;
        let uuid = ChatRegistry.getUUID();

        let interval = setInterval(() => {

            reconnectDelay--;

            if (ChatRegistry.getUUID() !== uuid || this.#cancelledSkip) {
                clearInterval(interval)
                return;
            }

            if (reconnectDelay <= 0) {
                element.remove();
                AutoSkipManager.startIfPossible();
                clearInterval(interval);
                return;
            }

            this.updateSecondsLeft(reconnectDelay);

        }, 1000);

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
