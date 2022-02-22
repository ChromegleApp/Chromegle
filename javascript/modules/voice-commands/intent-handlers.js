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

    removeUtterance(utterance) {
        const index = this.#utterances.indexOf(utterance);
        if (index >= 0) this.#utterances.splice(index, 1);
    }

    getUtterances() {
        return this.#utterances;
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
            AutoSkipManager.skipIfPossible();
        }

        AutoSkipManager.startIfPossible();
    }

}

class StopIntentHandler extends AbstractIntentHandler {

    constructor() {
        super();
        this.setName("Stop Chat");
        this.addUtterances("stop chat", "end chat", "stop that");
    }

    handle(utterance) {
        AutoSkipManager.skipIfPossible();
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
            AutoSkipManager.startIfPossible();
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
        let textContent = this.getArguments(utterance);
        const totalTime = GreetingManager.typingDelay(textContent, config.typingSpeedField.getLocalValue());
        const timePerMessage = totalTime / textContent.length;

        GreetingManager.writeMessage(
            $(".chatmsg"),
            textContent,
            timePerMessage,
            config.sendDelayField.getLocalValue() * 1000,
            ChatRegistry.getUUID()
        );

    }
}
