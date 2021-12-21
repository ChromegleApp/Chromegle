class ChatRegistry {

    static #documentMutationObserver;

    static #currentlyChatting = false;
    static isChatting = () => ChatRegistry.#currentlyChatting;
    static setChatting = (status) => ChatRegistry.#currentlyChatting = status;
    static #chatPageEnabled = false;
    static pageStarted = () => ChatRegistry.#chatPageEnabled;

    static #chatUUID = undefined;
    static getUUID = () => ChatRegistry.#chatUUID;
    static setUUID = () => ChatRegistry.#chatUUID = uuid4();
    static clearUUID = () => ChatRegistry.#chatUUID = undefined;

    constructor() {
        ChatRegistry.#documentMutationObserver = new MutationObserver(ChatRegistry.#onDocumentMutation);
    }

    startObserving() {
        ChatRegistry.#documentMutationObserver.observe(document, {subtree: true, childList: true, attributes: true}); //attributeFilter : ['class']});
        document.addEventListener("click", ChatRegistry.#onButtonClick)
    }


    static #onButtonClick(event) {
        if (event.target.classList.contains("disconnectbtn")) {
            document.dispatchEvent(new CustomEvent('chatButtonClicked', {event: event}));
        }

        // For banned -> Non-banned is able to use the onDocumentMutation
        if (["videobtn", "textbtn"].includes(event.target.id)) {
            if (!ChatRegistry.pageStarted()) {
                ChatRegistry.#chatPageEnabled = true;
                document.dispatchEvent(new CustomEvent('pageStarted', {detail: {button: event.target}}));
            }
        }
    }

    static #onDocumentMutation (mutation) {

        for (let mutationRecord of mutation) {

            // FAIL STUFF

            if (mutationRecord.target["innerText"] != null) {
                if (mutationRecord.target["innerText"].includes("Error connecting to server")) {
                    Logger.ERROR("Chat failed to connect, user is likely soft-banned due to a VPN or proxy")
                    document.dispatchEvent(new CustomEvent('chatFailedConnect', {detail: mutationRecord.target}));
                    ChatRegistry.setChatting(false);
                    ChatRegistry.clearUUID();
                    return;
                }
            }

            // REGULAR STUFF
            if (!mutationRecord.target.classList.contains("chatmsg")) continue;

            if (!ChatRegistry.pageStarted()) {
                ChatRegistry.#chatPageEnabled = true;
                document.dispatchEvent(new CustomEvent('pageStarted', {detail: {button: mutationRecord.target}}));
            }

            const containsDisabled = mutationRecord.target.classList.contains("disabled");

            if (ChatRegistry.isChatting() && containsDisabled) {
                Logger.INFO("Chat Ended: UUID <%s>", ChatRegistry.getUUID());
                ChatRegistry.setChatting(false);
                ChatRegistry.clearUUID();
                document.dispatchEvent(new CustomEvent('chatEnded', {detail: {button: mutationRecord.target}}));
                continue;
            }

            if (!ChatRegistry.isChatting() && !containsDisabled) {
                ChatRegistry.setChatting(true);
                ChatRegistry.setUUID();
                Logger.INFO("Chat Started: UUID <%s>", ChatRegistry.getUUID());
                document.dispatchEvent(new CustomEvent('chatStarted', {detail: {button: mutationRecord.target, uuid: ChatRegistry.getUUID()}}));
            }

        }

    }

}