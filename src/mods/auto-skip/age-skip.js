class AgeSkipManager extends Module {

    #checkedCount = 0;
    #maxCheckedCount = 5;
    #minAge;
    #maxAge;
    #enabled;

    #parseAgeRange(raw) {

        // Type 1: A-B range
        let split = raw.split("-");
        if (split.length === 2) {
            let min, max;
            try {
                min = parseInt(split[0]);
                max = parseInt(split[1]);
            } catch (ex) {
                return [null, null];
            }

            return [min, max].sort((a, b) => a - b);
        }

        // Type 2: A+ range
        if (raw.includes("+")) {
            let min;
            try {
                min = parseInt(raw.replace("+", ""));
            } catch (ex) {
                return [null, null];
            }

            return [min, null];

        }

    }

    async retrieveAgeRange() {
        let rawAgeRange = await config.autoSkipAgeField.retrieveValue();
        return this.#parseAgeRange(rawAgeRange);
    }

    async onPageStarted() {
        let range = await this.retrieveAgeRange();
        this.#minAge = range[0];
        this.#maxAge = range[1];
        this.#enabled = (await config.autoSkipAgeToggle.retrieveValue()) === "true";
    }

    async onSettingsUpdate(event) {
        let ageRange = config.autoSkipAgeField.fromSettingsUpdateEvent(event);

        if (ageRange != null) {
            let range = this.#parseAgeRange(ageRange);
            this.#minAge = range[0];
            this.#maxAge = range[1];
            return;
        }

        let skipWordsEnabled = config.autoSkipAgeToggle.fromSettingsUpdateEvent(event);

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

        if (this.outOfRange(message)) {
            sendErrorLogboxMessage(`Skipped user who was out of the age range \"${this.createAgeRange()}\" you selected.`);
            skipIfPossible();
        }

    }

    createAgeRange() {

        if (this.#minAge && this.#maxAge) {
            return `${this.#minAge}-${this.#maxAge}`;
        }

        if (this.#minAge) {
            return `${this.#minAge}+`;
        }

        return "<invalid range>"
    }

    outOfRange(message) {

        let age = this.getAge(message)

        if (age == null) {
            return false;
        }

        if (this.#minAge && age < this.#minAge) {
            return true;
        }

        return this.#maxAge && age > this.#maxAge;

    }

    #cleanMessageContent(content) {
        if (content == null) {
            return "";
        }

        return content
            .trim()
            .toLowerCase()
            .replaceAll(" +", " ");
    }

    getAge(message) {

        // Clean the content up
        let cleanedContent = this.#cleanMessageContent(message.content);
        let strangerMessages = ChatRegistry.strangerMessages();
        let userMessages = ChatRegistry.userMessages();

        // First message is stranger's
        if (message.messageNumber === 1 || strangerMessages.length === 1) {
            let age = AgeChecks.standardCheck(cleanedContent);
            if (age != null) {
                return age;
            }
        }

        // Age is formatted like "18m"
        let age = AgeChecks.genderedCheck(cleanedContent);
        if (age != null) {
            return age;
        }

        // Check if there is MESSAGE CONTEXT asking about age
        let previousMessages = [
            userMessages.pop(),
            strangerMessages.pop(),
            userMessages?.slice(-2)?.[0],
            strangerMessages?.slice(-2)?.[0],
        ]

        for (let previousMessage of previousMessages) {

            if (previousMessage == null) {
                continue;
            }

            // If previous message isn't about age
            let cleanedPrevious = this.#cleanMessageContent(previousMessage.content || "");
            if (!AgeChecks.isAgeQuery(cleanedPrevious)) {
                continue;
            }

            let age = AgeChecks.standardCheck(cleanedContent);
            if (age != null) {
                return age;
            }
        }

        return null;

    }

}


let AgeChecks = {

    /**
     * Is a message asking about age
     * e.g. "age?"
     */
    isAgeQuery: (m) => {
        const queries = [
            "age", "old", "asl"
        ]

        for (let query of queries) {
            if (m.includes(query)) {
                return true;
            }
        }

        return false;
    },

    /**
     * Standalone check
     * e.g. "Hi I am 18"
     * e.g. "18 m"
     * e.g. "18 b"
     */
    standardCheck: (m) => {
        let split = m.split(" ");

        for (let word of split) {
            if (isNumeric(word)) {
                try {
                    let int = parseInt(word);
                    return (int < 120 && int > 0) && !isNaN(int) ? int : null;
                } catch (ex) {
                }

            }
        }

        return null;
    },

    /**
     *
     * Gendered/position check
     * e.g. "18 m"
     * e.g. "18 b"
     * e.g. "18f"
     */
    genderedCheck: (m) => {
        let pattern = /(\d+) *([mftbv])/g;
        let result = pattern.exec(m);

        if (result?.[0]) {
            let res = result[0];
            try {
                return this.standardCheck(
                    res.replaceAll(/[mftbv ]/g, "")
                )
            } catch (ex) {
                return null;
            }
        }

        return null;

    }

}