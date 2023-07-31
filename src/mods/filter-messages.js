class TextFilter {

    filterLoaded = false;
    filters = {profanity: null, sexual: null};
    enabled = {profanity: false, sexual: false};

    constructor() {
        this.setup().then(() => {
            Logger.DEBUG("Loaded filters");
            this.filterLoaded = true;
        });
    }

    async setup() {
        // Load Filters
        this.filters.profanity = await this.loadFilter('/public/txt/profanity.txt');
        this.filters.sexual = await this.loadFilter('/public/txt/sexual.txt');
    }

    setStatus(filter, status) {
        if (this.enabled[filter] == null || status == null) {
            return;
        }

        this.enabled[filter] = status;
    }

    async loadFilter(file) {
        let response = await fetch(chrome.runtime.getURL(file));
        let text = await response.text();
        return text.replaceAll("\r", "").split("\n");
    }

    filterNode(node) {

        for (const childNode of node.childNodes) {

            if (childNode.nodeType === Node.TEXT_NODE) {

                childNode.replaceWith(
                    ...this.filterTextNode(childNode)
                );

            }
        }

    }

    filterEntries() {
        return Object.entries(this.filters).filter(([name, _]) => this.enabled[name]);
    }

    filterTextNode(node) {

        let filterEntries = this.filterEntries();
        let testSpan = document.createElement("span");
        testSpan.innerHTML = node.nodeValue;

        let placeholders = {};

        for (let nodeWord of node.nodeValue.split(" ")) {
            for (let [_, filterWords] of filterEntries) {

                for (let filterWord of filterWords) {
                    if (nodeWord.toLowerCase() === filterWord) {

                        // Create placeholder
                        let placeholder = shortUuid();
                        placeholders[placeholder] = nodeWord;

                        // Temporarily store it
                        testSpan.innerHTML = testSpan.innerHTML.replace(
                            nodeWord, placeholder
                        );

                    }

                }

            }

        }

        // Re-place the words
        for (const [placeholder, word] of Object.entries(placeholders)) {
            testSpan.innerHTML = testSpan.innerHTML.replace(
                placeholder, ReSpoiler(word).outerHTML
            )
        }

        return testSpan.childNodes;

    }

}



class FilterManager extends Module {

    filter = new TextFilter();

    async onPageStarted() {
        await this.setupFilter();
    }

    async setupFilter() {
        let profanityToggle = await config.profanityFilterToggle.retrieveValue();
        let sexualToggle = await config.sexualFilterToggle.retrieveValue();

        if (profanityToggle) this.filter.setStatus("profanity", profanityToggle === "true");
        if (sexualToggle) this.filter.setStatus("sexual", sexualToggle === "true");
    }

    onChatMessage(event) {

        /** @type ChatMessage */
        let message = event.detail;

        // Only filter strangers' messages
        if (!message.isStranger()) {
            return;
        }

        // Filter it
        this.filter.filterNode(message.spanElement);

    }

    onSettingsUpdate(event) {
        let profanityToggle = config.profanityFilterToggle.fromSettingsUpdateEvent(event);
        let sexualToggle = config.sexualFilterToggle.fromSettingsUpdateEvent(event);

        // If updated
        if (profanityToggle) this.filter.setStatus("profanity", profanityToggle === "true");
        if (sexualToggle) this.filter.setStatus("sexual", sexualToggle === "true");

    }

}




