class AbstractIntentHandler {

    #name
    #utterances = []

    setName(name) {
        this.#name = name;
    }

    getName() {
        return this.#name;
    }

    addUtterances(...utterance) {
        this.#utterances.push(...utterance);
    }

    getArguments(utterance) {
        for (let _utterance of this.#utterances) {
            let indexOf = utterance.indexOf(_utterance)
            if ((indexOf >= 0)) {
                utterance = utterance.substr(indexOf + _utterance.length, utterance.length).trim();
                break;
            }
        }

        return utterance;
    }

    canHandle(utterance) {
        return containsWord(this.#utterances, utterance)
    }

    handle(utterance) {

    }

}

class SkipIntentHandler extends AbstractIntentHandler {

    constructor() {
        super();
        this.setName("Skip Chat");
        this.addUtterances("skip chat", "next chat", "snapchat", "nest chat", "text chat", "next track");
    }

    handle(utterance) {

        if (ChatRegistry.isChatting()) {
            skipIfPossible();
        }

        setTimeout(() => {
            if (!ChatRegistry.isChatting()) {
                startIfPossible();
            }
        }, 150);
        
    }

}

class StopIntentHandler extends AbstractIntentHandler {

    constructor() {
        super();
        this.setName("Stop Chat");
        this.addUtterances("stop chat", "end chat", "stop that");
    }

    handle(utterance) {
        skipIfPossible();
    }

}

class StartIntentHandler extends AbstractIntentHandler {

    constructor() {
        super();
        this.setName("Start Chat");
        this.addUtterances("start chat");
    }

    handle(utterance) {
        if (!ChatRegistry.isChatting()) {
            startIfPossible();
        }
    }

}


class MessageIntentHandler extends AbstractIntentHandler {

    constructor() {
        super();
        this.setName("Send Message");
        this.addUtterances("send message", "send a message");
    }

    handle(utterance) {

        // Already writing
        if (AutoMessageManager.writingMessage) {
            Logger.ERROR("Failed to send voice message, an auto-message is currently in progress.");
            sendErrorLogboxMessage("ERROR: Failed to send voice message, an auto-message is currently in progress.");
            return;
        }

        const typingSpeed = config.typingSpeedField.retrieveValue();
        const sendDelay = config.sendDelayField.retrieveValue();
        const chatUUID = ChatRegistry.getUUID();
        const textContent = this.getArguments(utterance);

        typingSpeed.then(async (withSpeed) => {
            const withDelay = await sendDelay;
            const totalTime = AutoMessageManager.getTypingDelay(textContent, withSpeed);
            const timePerMessage = totalTime / textContent.length;

            // Send Message
            AutoMessageManager.writeMessage(
                $(".chatmsg"),
                textContent,
                timePerMessage,
                withDelay * 1000,
                chatUUID
            );

        });

    }
}
