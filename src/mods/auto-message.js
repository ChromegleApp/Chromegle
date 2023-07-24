class AutoMessageManager extends Module {

    static writingMessage = false;

    async onChatStarted() {
        let greetingEnabled = await config.greetingToggle.retrieveValue();

        if (greetingEnabled !== "true") {
            return;
        }

        // Load config values
        const startTypingDelay = await config.startTypingDelayField.retrieveValue();
        const greetingMessages = await config.greetingMessageField.retrieveValue();
        const typingSpeed = await config.typingSpeedField.retrieveValue();
        const sendDelay = await config.sendDelayField.retrieveValue();
        const messageContent = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
        const totalTime = AutoMessageManager.getTypingDelay(messageContent, typingSpeed);
        const timePerMessage = totalTime / messageContent.length;

        Logger.DEBUG("Retrieved auto-message text options, picking one at random: %s", JSON.stringify(greetingMessages));
        let uuid = ChatRegistry.getUUID();

        // Send the message after a certain delay
        setTimeout(() => {
            AutoMessageManager.writeMessage(
                $(".chatmsg"),
                messageContent,
                timePerMessage,
                sendDelay * 1000,
                uuid
            );
        }, startTypingDelay * 1000)


    }

    onSettingsUpdate(event) {
        let greetingEnabled = config.greetingToggle.fromSettingsUpdateEvent(event);

        if (greetingEnabled === "false") {
            AutoMessageManager.cancelMessage();
        }
    }

    static getTypingDelay(text, wpm) {
        let adjustFactor = 0.5;
        let totalTypeDelay = (60 / (wpm === null ? 0.1 : wpm)) * (text.length / 8) * 1000;
        return totalTypeDelay * adjustFactor;
    }

    static cancelMessage(interval) {
        clearInterval(interval);
        this.writingMessage = false;
    }

    static writeMessage(target, message, letterDelay, sendDelay, chatUUID) {

        this.writingMessage = true;

        const interval = setInterval(() => {

            // Chat ended
            if (chatUUID !== ChatRegistry.getUUID() || $(target)?.get(0)?.classList?.contains("disabled")) {
                AutoMessageManager.cancelMessage(interval);
                return;
            }

            // If message finished
            if (message.length === 0) {
                setTimeout(() => $(".sendbtn")?.get(0)?.click(), sendDelay);
                AutoMessageManager.cancelMessage(interval);
                return;
            }

            let keydown = document.createEvent('KeyboardEvent');
            let keyup = document.createEvent('KeyboardEvent');

            keydown.initKeyboardEvent("keydown", true, true, undefined, false, false, false, false, message[0], message[0]);
            keyup.initKeyboardEvent("keyup", true, true, undefined, false, false, false, false, message[0], message[0]);

            target.get(0).dispatchEvent(keydown);
            target.get(0).dispatchEvent(keyup);
            target.val(target.val() + message[0]);

            // Take one away
            message = message.substring(1, message.length);

        }, letterDelay);


    }

}








