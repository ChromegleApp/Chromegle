const ChatRegistry = {

    documentMutationObserver: undefined,

    currentlyChatting: false,
    chatPageEnabled: false,
    chatUUID: undefined,
    videoChatEnabled: undefined,

    pageStarted: () => ChatRegistry.chatPageEnabled,
    isChatting: () => ChatRegistry.currentlyChatting,
    setChatting: (status) => ChatRegistry.currentlyChatting = status,
    isVideoChat: () => ChatRegistry.videoChatEnabled,
    setVideoChat: (status) => ChatRegistry.videoChatEnabled = status,
    getUUID: () => ChatRegistry.chatUUID,
    setUUID: () => ChatRegistry.chatUUID = uuid4(),
    clearUUID: () => ChatRegistry.chatUUID = undefined,

    startObserving() {
        ChatRegistry.documentMutationObserver = new MutationObserver(ChatRegistry.onDocumentMutation);
        ChatRegistry.documentMutationObserver.observe(document, {subtree: true, childList: true, attributes: true}); //attributeFilter : ['class']});
        document.addEventListener("click", ChatRegistry.onButtonClick)
    },

    onButtonClick(event) {
        if (event.target.classList.contains("disconnectbtn")) {
            document.dispatchEvent(new CustomEvent('chatButtonClicked', {detail: event}));
        }

        // For banned -> Non-banned is able to use the onDocumentMutation
        if (["videobtn", "textbtn"].includes(event.target.id)) {
            if (!ChatRegistry.pageStarted()) {
                ChatRegistry.chatPageEnabled = true;
                ChatRegistry.setVideoChat($("#videowrapper").get(0) != null);
                document.dispatchEvent(new CustomEvent('pageStarted', {detail: {button: event.target, isVideoChat: ChatRegistry.isVideoChat()}}));
            }
        }
    },

    onDocumentMutation (mutation) {

        for (let mutationRecord of mutation) {

            if (mutationRecord.target.id === "othervideospinner") {
                let spinner = $(mutationRecord.target);
                if (spinner.get(0).style.display === "none" && ChatRegistry.isChatting()) {
                    document.dispatchEvent(new CustomEvent("videoChatLoaded"));
                }
                continue;
            }

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
                ChatRegistry.chatPageEnabled = true;
                ChatRegistry.setVideoChat($("#videowrapper").get(0) != null);
                document.dispatchEvent(new CustomEvent('pageStarted', {detail: {button: mutationRecord.target, isVideoChat: ChatRegistry.isVideoChat()}}));
            }

            const containsDisabled = mutationRecord.target.classList.contains("disabled");

            if (ChatRegistry.isChatting() && containsDisabled) {
                Logger.INFO("Chat Ended: UUID <%s>", ChatRegistry.getUUID());
                ChatRegistry.setChatting(false);
                ChatRegistry.clearUUID();
                document.dispatchEvent(new CustomEvent('chatEnded', {detail: {button: mutationRecord.target, isVideoChat: ChatRegistry.isVideoChat()}}));
                continue;
            }

            if (!ChatRegistry.isChatting() && !containsDisabled) {
                ChatRegistry.setChatting(true);
                ChatRegistry.setUUID();
                Logger.INFO("Chat Started: UUID <%s>", ChatRegistry.getUUID());
                document.dispatchEvent(
                    new CustomEvent('chatStarted', {detail: {button: mutationRecord.target, uuid: ChatRegistry.getUUID(), isVideoChat: ChatRegistry.isVideoChat()}})
                );
            }

        }

    }

}