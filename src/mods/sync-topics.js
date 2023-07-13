class TopicSyncManager extends Module {

    constructor() {
        super();
        this.loadFromSync();
        this.addEventListener("beforeunload", this.beforeUnload, undefined, window);
    }

    /**
     * Load saved topics from syncing
     */
    loadFromSync() {
        chrome.storage.sync.get(["STORED_TOPIC_LIST"],
            (val) => {
                let cachedTopicString = JSON.stringify(val["STORED_TOPIC_LIST"]);
                let cookieTopicString = Cookies.get("topiclist", {domain: ".omegle.com"});

                Logger.DEBUG("Cached Topics: %s | Cookie Topics: %s", cachedTopicString, cookieTopicString);

                if (cachedTopicString !== cookieTopicString && val["STORED_TOPIC_LIST"] != null) {
                    Cookies.set("topiclist", cachedTopicString, {domain: ".omegle.com"});
                    Logger.INFO("Updated Omegle cookie values on <%s> event: %s", "pageload", cachedTopicString);
                    window.location.reload();
                }
            }
        );
    }

    /**
     * Sync stored topic with cookies on page unload
     */
    beforeUnload(event) {
        const cookies = Cookies.get("topiclist", {domain: ".omegle.com"}) || null;
        if (cookies != null) {
            chrome.storage.sync.set(
                {
                    "STORED_TOPIC_LIST": JSON.parse(cookies)
                }
            ).then();
        }
        Logger.INFO("Updated sync-storage cached topics on <%s> event: %s", event.type, cookies);
    }

    /**
     * Sync stored topic with cookies on chat start
     */
    onPageStarted() {
        const cookies = Cookies.get("topiclist", {domain: ".omegle.com"}) || null;
        chrome.storage.sync.set({"STORED_TOPIC_LIST": JSON.parse(cookies)}).then();
        Logger.INFO("Updated sync-storage cached topics on <%s> event: %s", event.type, cookies);
    }
}





