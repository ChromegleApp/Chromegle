let filters = {profanity: [], sexual: [], allFilters: []}

document.addEventListener(
    "pageStarted",
    () => {
        function loadFilterFromFile(path, key) {
            fetch(chrome.runtime.getURL(path))
                .then(response => response.text()).then(response => response.replaceAll("\r", ""))
                .then(response => response.split("\n"))
                .then(data => {
                    filters[key] = data;
                    filters["allFilters"] = filters["allFilters"].concat(data);
                });
        }

        loadFilterFromFile('/javascript/automation/web-filtering/profanity.txt', "profanity");
        loadFilterFromFile('/javascript/automation/web-filtering/sexual.txt', "sexual");

        statusObserver.observe(document.getElementsByClassName("logbox")[0], {attributes: true, subtree: true, childList: true});

    }
);

let statusObserver = new MutationObserver((mutationRecord) => {

    let filterQuery = {};
    filterQuery[config.profanityFilterToggle.getName()] = config.profanityFilterToggle.getDefault();
    filterQuery[config.sexualFilterToggle.getName()] = config.sexualFilterToggle.getDefault();

    chrome.storage.sync.get(filterQuery, (result) => {

        // Get filter config
        let filteredWords;
        const sexualFilter = result[config.sexualFilterToggle.getName()] === "true";
        const profanityFilter = result[config.profanityFilterToggle.getName()] === "true";

        // Apply filter config
        if (sexualFilter && profanityFilter) filteredWords = filters["allFilters"]
        else if (sexualFilter) filteredWords = filters["sexual"]
        else if (profanityFilter) filteredWords = filters["profanity"]
        else filteredWords = [];

        // Do filtering
        mutationRecord.forEach((mutation) => {
            let maybeLog = $(mutation.addedNodes.item(0)).get(0);
            if (maybeLog == null) return;
            if (maybeLog.nodeName !== "DIV" || !maybeLog.classList.contains("logitem")) return;

            for (let span of maybeLog.getElementsByTagName("span")) {
                span.textContent = filterString(span.textContent, filteredWords);
            }

        })

    });

});



let filterString = (message, filteredWords) => {

    for (let word of filteredWords) {
        message = message.replaceAll(word, "*".repeat(word.length))
    }

    return message;

}

