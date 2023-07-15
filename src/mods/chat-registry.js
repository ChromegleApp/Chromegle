class ChatRegistryManager extends Module {

    constructor() {
        super();

        ChatRegistry = this;

        this.#observer.observe(document, {subtree: true, childList: true, attributes: true});
        this.addEventListener("click", this.onButtonClick, undefined, document);

    }

    #setUUID = () => this.#chatUUID = shortUuid();
    #clearUUID = () => this.#chatUUID = null;

    #observer = new MutationObserver(this.onMutationObserved.bind(this));
    #isChatting = false;
    #isVideoChat = null;
    #pageStarted = false;
    #chatUUID = null;
    #videoChatLoaded = false;

    isChatting = () => this.#isChatting;
    isVideoChat = () => this.#isVideoChat;
    isTextChat = () => !this.#isVideoChat;
    pageStarted = () => this.#pageStarted;
    getUUID = () => this.#chatUUID;

    onButtonClick(event) {

        if (event.target.classList.contains("disconnectbtn")) {
            document.dispatchEvent(new CustomEvent('chatButtonClicked', {detail: event}));
        }

        // For banned -> Non-banned is able to use the onDocumentMutation
        if (["videobtn", "textbtn"].includes(event.target.id)) {
            if (!this.pageStarted()) {
                this.#pageStarted = true;
                this.#isVideoChat = $("#videowrapper").get(0) != null;
                document.dispatchEvent(new CustomEvent('pageStarted', {detail: {button: event.target, isVideoChat: this.isVideoChat()}}));
            }
        }
    }

    onMutationObserved(mutations) {

        // Should be LAST b.c. it matters if the chat has ended
        mutations.sort((a, b) => {
            if (a.target.id === "othervideospinner") {
                return 1;
            }
            else if (b.target.id === "othervideospinmner") {
                return -1;
            }

            return -1;

        });

        for (let mutationRecord of mutations) {
           this.onMutationRecord(mutationRecord);
        }
    }

    onMutationRecord(mutationRecord) {

        // Chat Loaded
        if (mutationRecord.target.id === "othervideospinner") {
            let spinner = $(mutationRecord.target);

            if (spinner.get(0).style.display === "none" && this.isChatting() && !this.#videoChatLoaded) {
                document.dispatchEvent(new CustomEvent("videoChatLoaded"));
                this.#videoChatLoaded = true;
            }
            return;
        }

        // Chat failed
        if (mutationRecord.target["innerText"] != null) {
            if (mutationRecord.target["innerText"].includes("Server was unreachable for too long")) {
                Logger.ERROR("Chat failed to connect, you are likely using a VPN or proxy which Omegle has detected and blocked.")
                document.dispatchEvent(new CustomEvent('chatFailedConnect', {detail: mutationRecord.target}));
                this.#isChatting = false;
                this.#clearUUID();
                return;
            }
        }

        // REGULAR STUFF
        if (mutationRecord.target.classList.contains("chatmsg")) {
            this.onChatMutationRecord(mutationRecord);
        }

    }

    onChatMutationRecord(mutationRecord) {

        if (!this.pageStarted()) {
            this.#pageStarted = true;
            this.#isVideoChat = $("#videowrapper").get(0) != null;
            document.dispatchEvent(new CustomEvent('pageStarted', {detail: {button: mutationRecord.target, isVideoChat: this.isVideoChat()}}));
        }

        const containsDisabled = mutationRecord.target.classList.contains("disabled");

        if (this.isChatting() && containsDisabled) {
            Logger.INFO("Chat Ended: UUID <%s>", this.getUUID());
            this.#isChatting = false;
            let uuid = this.getUUID() + '';
            this.#clearUUID();
            document.dispatchEvent(
                new CustomEvent('chatEnded',
                        {
                            detail: {
                                "button": mutationRecord.target,
                                "isVideoChat": this.isVideoChat(),
                                "uuid": uuid
                            }
                        }
                    )
            );
            return;
        }

        if (!this.isChatting() && !containsDisabled) {
            this.#isChatting = true;
            this.#videoChatLoaded = false;
            this.#setUUID();
            Logger.INFO("Chat Started: UUID <%s>", this.getUUID());
            document.dispatchEvent(
                new CustomEvent('chatStarted', {detail: {button: mutationRecord.target, uuid: this.getUUID(), isVideoChat: this.isVideoChat()}})
            );
        }

    }

}
