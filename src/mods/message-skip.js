class MessageSkipManager extends Module {

    #checkedCount = 0;
    #maxCheckedCount = 5;
    #badWords;
    #enabled;

    #parseBadMessages(raw) {
        let messages = raw.split(",");
        let validatedMessages = [];

        for (let message of messages) {
            if (message.length > 0) {
                validatedMessages.push(message);
            }
        }

        return validatedMessages;
    }
    async retrieveBadMessages() {
        let rawBadMessages = await config.autoSkipWordsField.retrieveValue();
        return this.#parseBadMessages(rawBadMessages);
    }

    async onPageStarted() {
        this.#badWords = await this.retrieveBadMessages();
        this.#enabled = (await config.autoSkipWordsToggle.retrieveValue()) === "true";
    }

    async onSettingsUpdate(event) {
        let badMessages = config.autoSkipWordsField.fromSettingsUpdateEvent(event);

        if (badMessages != null) {
            this.#badWords = this.#parseBadMessages(badMessages);
            return;
        }

        let skipWordsEnabled = config.autoSkipWordsToggle.fromSettingsUpdateEvent(event);

        if (skipWordsEnabled != null) {
            this.#enabled = skipWordsEnabled === "true";
        }
    }

    onChatEnded() {
        this.#checkedCount = 0;
    }

    onChatMessage(event) {

        // Disabled module OR already checked first N.
        if (!this.#enabled || this.#checkedCount > this.#maxCheckedCount) {
            return;
        }

        /** @type ChatMessage */
        let message = event.detail;

        // Only strangers count
        if (!message.isStranger()) {
            return;
        }

        this.#checkedCount++;
        let lowerContent = message.content.toLowerCase();

        for (let badWord of this.#badWords) {
            if (lowerContent.includes(badWord)) {
                sendErrorLogboxMessage(`Skipped user who said auto-skip word \"${ReSpoiler(badWord).outerHTML}\".`);
                AutoSkipManager.skipIfPossible();
                break;
            }
        }
    }

}