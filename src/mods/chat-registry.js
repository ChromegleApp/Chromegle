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

    /** @type ChatMessage[] */
    #messages = [];

    userMessages() {
        return this.#messages.filter(msg => msg.isUser)
    }

    strangerMessages() {
        return this.#messages.filter(msg => msg.isStranger());
    }

    isVideoChatLoaded = () => this.#videoChatLoaded;
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
        if (["videobtn", "textbtn", "videobtnunmoderated"].includes(event.target.id)) {
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

        if (!this.#pageStarted) {
            return;
        }

        // Chat Loaded
        if (mutationRecord.target.id === "othervideospinner") {

            if (mutationRecord.target.style.display === "none" && this.isChatting() && !this.#videoChatLoaded) {
                this.#videoChatLoaded = true;
                document.dispatchEvent(new CustomEvent("videoChatLoaded"));
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

        // Chat Log
        if (mutationRecord?.addedNodes?.[0]?.classList?.contains("logitem")) {
            this.onLogItemAdded(mutationRecord.addedNodes[0])
        }

    }

    onLogItemAdded(logItemNode) {
        let innerNode = logItemNode?.childNodes?.[0];

        // Determine if user message
        if (innerNode?.classList?.contains("youmsg") || innerNode?.classList?.contains("strangermsg")) {
            let isUser = innerNode.classList.contains("youmsg");
            let idx = this.#messages.length;
            let message = new ChatMessage(isUser, innerNode?.childNodes?.[2].textContent, innerNode, idx);

            this.#messages.push(message);
            document.dispatchEvent(new CustomEvent('chatMessage', {detail: message}))
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
            this.#messages = [];
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

class ChatMessage {

    constructor(isUser, content, element, index) {

        /** @type boolean */
        this.isUser = isUser;

        /** @type string */
        this.content = content;

        /** @type HTMLElement */
        this.element = element;

        /** @type Number */
        this.messageNumber = index + 1;

        /** @type HTMLSpanElement|null */
        this.spanElement = this.element?.querySelector("span") || null;

    }

    getTextNodes() {
        let childNodes = this.spanElement?.childNodes || [];
        let textNodes = [];

        for (let childNode of childNodes) {
            if (childNode.nodeType === Node.TEXT_NODE) {
                textNodes.push(childNode);
            }
        }

        return textNodes;
    }

    isStranger() {
        return !this.isUser;
    }

}
