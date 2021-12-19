class ChatRegistry {

    // Instance Variables
    #observer;

    // Handle Chatting Status
    static #currentlyChatting = false;
    static isChatting = () => ChatRegistry.#currentlyChatting;
    static setChatting = (status) => ChatRegistry.#currentlyChatting = status;
    static #chatPageEnabled = false;
    static pageStarted = () => this.#chatPageEnabled;

    static #chatUUID = undefined;
    static getUUID = () => this.#chatUUID;
    static setUUID = () => this.#chatUUID = uuid4();
    static clearUUID = () => this.#chatUUID = undefined;

    constructor() {
        this.#observer = new MutationObserver(this.#onDocumentMutation);
    }

    startObserving() {
        this.#observer.observe(document, {subtree: true, attributeFilter : ['class']});
        document.addEventListener("click", ChatRegistry.#onButtonClick)
    }

    static #onButtonClick(event) {
        if (event.target.classList.contains("disconnectbtn")) {
            document.dispatchEvent(new CustomEvent('chatButtonClicked', {event: event}));
        }
    }

    #onDocumentMutation (mutation) {
        mutation.forEach(function(mutationRecord) {
            if (!mutationRecord.target.classList.contains("chatmsg")) return;

            if (!ChatRegistry.pageStarted()) {
                ChatRegistry.#chatPageEnabled = true;
                document.dispatchEvent(new CustomEvent('pageStarted', {detail: {button: mutationRecord.target}}));
            }

            const containsDisabled = mutationRecord.target.classList.contains("disabled");

            if (ChatRegistry.isChatting() && containsDisabled) {
                console.log(`Chat Ended @ UUID ${ChatRegistry.getUUID()}`);
                ChatRegistry.setChatting(false);
                ChatRegistry.clearUUID();
                document.dispatchEvent(new CustomEvent('chatEnded', {detail: {button: mutationRecord.target}}));
                return;
            }

            if (!ChatRegistry.isChatting() && !containsDisabled) {
                ChatRegistry.setChatting(true);
                ChatRegistry.setUUID();
                console.log(`Chat Started @ UUID ${ChatRegistry.getUUID()}`);
                document.dispatchEvent(new CustomEvent('chatStarted', {detail: {button: mutationRecord.target, uuid: ChatRegistry.getUUID()}}));
            }

        });

    }

}