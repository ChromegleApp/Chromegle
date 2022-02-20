const FilterManager = {
    filters: {profanity: [], sexual: [], allFilters: []},
    filteredWords: [],

    initialize: () => {
        FilterManager._pageStarted();
        FilterManager._storageUpdate();
        FilterManager._chatStarted();
    },

    _chatStarted() {
        document.addEventListener("chatStarted", () => {
            FilterManager.statusObserver.disconnect();
            FilterManager.statusObserver.observe(
                document.getElementsByClassName("logbox")[0], {attributes: true, subtree: true, childList: true}
            );

            $(".chatmsg").off().on("input", (event) => {
                $(event.target).val(FilterManager.filterString($(event.target).val(), FilterManager.filteredWords));
            });

        });
    },

    _storageUpdate() {
        document.addEventListener("storageSettingsUpdate", (detail) => {
            const keys = Object.keys(detail["detail"]);

            if (keys.includes(config.profanityFilterToggle.getName()) || keys.includes(config.sexualFilterToggle.getName())) {
                FilterManager.updateFilteredWords();
            }

        });
    },

    _pageStarted() {
        document.addEventListener(
            "pageStarted",
            () => {
                FilterManager.loadFilterFromFile('/javascript/modules/web-filtering/profanity.txt', "profanity")
                    .then(() => {
                        FilterManager.loadFilterFromFile('/javascript/modules/web-filtering/sexual.txt', "sexual")
                            .then(() => {
                                FilterManager.updateFilteredWords();
                            });
                    });

            }
        );
    },

    loadFilterFromFile(path, key) {
        return fetch(chrome.runtime.getURL(path))
            .then(response => response.text()).then(response => response.replaceAll("\r", ""))
            .then(response => response.split("\n"))
            .then(data => {
                FilterManager.filters[key] = data;
                FilterManager.filters["allFilters"] = FilterManager.filters["allFilters"].concat(data);
            });
    },

    updateFilteredWords() {
        let filterQuery = {};
        filterQuery[config.profanityFilterToggle.getName()] = config.profanityFilterToggle.getDefault();
        filterQuery[config.sexualFilterToggle.getName()] = config.sexualFilterToggle.getDefault();

        chrome.storage.sync.get(filterQuery, (result) => {

            // Get filter config
            const sexualFilter = result[config.sexualFilterToggle.getName()] === "true";
            const profanityFilter = result[config.profanityFilterToggle.getName()] === "true";

            // Apply filter config
            if (sexualFilter && profanityFilter) FilterManager.filteredWords = FilterManager.filters["allFilters"]
            else if (sexualFilter) FilterManager.filteredWords = FilterManager.filters["sexual"]
            else if (profanityFilter) FilterManager.filteredWords = FilterManager.filters["profanity"]
            else FilterManager.filteredWords = [];

        });
    },

    statusObserver: new MutationObserver((mutationRecord) => {

        // Do filtering
        mutationRecord.forEach((mutation) => {

            let maybeLog = $(mutation.addedNodes.item(0)).get(0);
            if (maybeLog == null) return;
            if (maybeLog.nodeName !== "DIV" || !maybeLog.classList.contains("logitem")) return;

            for (let span of maybeLog.getElementsByTagName("span")) {
                span.textContent = FilterManager.filterString(span.textContent, FilterManager.filteredWords);
            }

        })

    }),

    filterString(message, filteredWords) {

        for (let word of filteredWords) {
            message = message.replaceAll(word, "*".repeat(word.length))
        }

        return message;

    }

}






