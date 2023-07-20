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

    filterHTML(text) {

        let placeholders = {}

        // Find matches & replace with placeholders
        for (const [filter, status] of Object.entries(this.enabled)) {
            if (!status) continue;
            for (let word of this.filters[filter]) {
                let placeholder = shortUuid();
                placeholders[placeholder] = word;
                text = text.replaceAll(word, placeholder);
            }
        }

        // Replace matches
        for (const [placeholder, original] of Object.entries(placeholders)) {
            text = text.replaceAll(placeholder, ReSpoiler(original).outerHTML);
        }

        // Replace newlines with breaklines
        return text.replaceAll("\n", "<br/>");

    }
}



class FilterManager extends Module {

    filter = new TextFilter();
    observer = new MutationObserver(this.onMutationObserved.bind(this));

    constructor() {
        super();
    }

    async onPageStarted() {
        this.observer.observe(document.body, {childList: true, subtree: true});
        await this.setupFilter();
    }

    async setupFilter() {
        let profanityToggle = await config.profanityFilterToggle.retrieveValue();
        let sexualToggle = await config.sexualFilterToggle.retrieveValue();

        if (profanityToggle) this.filter.setStatus("profanity", profanityToggle === "true");
        if (sexualToggle) this.filter.setStatus("sexual", sexualToggle === "true");
    }

    onMutationObserved(mutation) {
        for (let mutationRecord of mutation) {
            for (let node of mutationRecord.addedNodes) {
                if (node?.classList?.contains("logitem")) {
                    this.filterLogItem(node);
                }
            }

        }
    }

    filterLogItem(node) {
        for (let childNode of node.childNodes) {
            for (let innerChildNode of childNode.childNodes) {
                if (innerChildNode.nodeName === "SPAN") {
                    innerChildNode.innerHTML = this.filter.filterHTML(innerChildNode.innerText);
                }
            }
        }
    }

    onSettingsUpdate(event) {
        let profanityToggle = config.profanityFilterToggle.fromSettingsUpdateEvent(event);
        let sexualToggle = config.sexualFilterToggle.fromSettingsUpdateEvent(event);

        // If updated
        if (profanityToggle) this.filter.setStatus("profanity", profanityToggle === "true");
        if (sexualToggle) this.filter.setStatus("sexual", sexualToggle === "true");

    }

}




