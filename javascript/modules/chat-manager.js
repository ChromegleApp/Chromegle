const ChatManager = {
    initialize() {
        document.addEventListener("chatStarted", (event) => ChatManager._chatStarted(event));
        document.addEventListener("chatFailedConnect", (event) => ChatManager._chatFailedConnect(event));
        document.addEventListener("chatEnded", () => ChatManager.cleanEndChat());
        document.addEventListener("click", () => ChatManager._onclick());
        document.addEventListener("keyup", (event) => {if (event.key === "Escape") ChatManager._onclick()})
    },

    _chatStarted(event) {

            let logItems = document.getElementsByClassName("statuslog");

            for (let log of logItems) {
                if (log.innerText.includes("HONG KONG")) {
                    log.innerHTML = `Thanks for using Chromegle! ${ConstantValues.getHelpfulTip()}`;
                }

            }

            if (event["detail"]["isVideoChat"]) {
                let self = $("#selfvideo").get(0);
                if (self !== null) {
                    $(self).css("z-index", "");
                }


            }
    },

    _onclick() {

        // Only when not chatting, but in the chat menu (between chats)
        if (ChatRegistry.isChatting() || $(".chatmsg").get(0) == null) {
            return;
        }

        ChatManager.cleanMidChat();
    },

    _chatFailedConnect(event) {
        ChatManager.cleanEndChat();
        ChatManager.cleanMidChat();

        event["detail"].innerHTML = (`
            <p class="statuslog">
                Chromegle: Unable to connect to Omegle. You are <a target='_blank' href='https://omegle.com/static/ban.html'>likely banned</a>
                due to a VPN or proxy, try a different one to continue.
            </p>
        `);
    },

    cleanEndChat() {
        const autoReconnect = $("label:contains('Auto-reroll')");

        if (autoReconnect.get(0) != null) autoReconnect.css("color", "");
        const stopReconnect = $('input[type="button"][value="Stop"]');

        if (stopReconnect.get(0) != null) {

            $(stopReconnect)
                .css("border", "none")
                .css("padding", "5px")
                .val("Click to Disable")
                .get(0).classList.add("conversationgreat");
        }
    },

    cleanMidChat() {
        /**
         * Get rid of auto re-roll styling
         */
        {
            const autoReconnect = $("label:contains('Auto-reroll')");

            if (autoReconnect.get(0) != null) {
                autoReconnect.css("color", "");
            }
        }

        /**
         * Override college button styling in-chat message
         */
        {
            const collegeStudent = $("strong:contains('College student')");

            if (collegeStudent.get(0) != null) {

                const collegeParent = $(collegeStudent.get(0).parentNode)
                    .removeAttr("style")
                    .addClass("conversationgreat")
                    .get(0);

                collegeParent.childNodes.item(0).remove();
                collegeParent.innerHTML = "<strong>College Student Chat</strong>";

                $(collegeParent.parentNode).css("margin-top", "10px")

            }
        }
    }

}









