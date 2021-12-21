let filters = {profanity: [], sexual: [], allFilters: []}
let filteredWords = []


document.addEventListener(
    "pageStarted",
    () => {
        loadFilterFromFile('/javascript/automation/web-filtering/profanity.txt', "profanity")
            .then(() => {
                loadFilterFromFile('/javascript/automation/web-filtering/sexual.txt', "sexual")
                    .then(() => {
                        updateFilteredWords();
                    });
            });

    }
);

function loadFilterFromFile(path, key) {
    return fetch(chrome.runtime.getURL(path))
        .then(response => response.text()).then(response => response.replaceAll("\r", ""))
        .then(response => response.split("\n"))
        .then(data => {
            filters[key] = data;
            filters["allFilters"] = filters["allFilters"].concat(data);
        });
}


function updateFilteredWords() {
    let filterQuery = {};
    filterQuery[config.profanityFilterToggle.getName()] = config.profanityFilterToggle.getDefault();
    filterQuery[config.sexualFilterToggle.getName()] = config.sexualFilterToggle.getDefault();

    chrome.storage.sync.get(filterQuery, (result) => {

        // Get filter config
        const sexualFilter = result[config.sexualFilterToggle.getName()] === "true";
        const profanityFilter = result[config.profanityFilterToggle.getName()] === "true";

        // Apply filter config
        if (sexualFilter && profanityFilter) filteredWords = filters["allFilters"]
        else if (sexualFilter) filteredWords = filters["sexual"]
        else if (profanityFilter) filteredWords = filters["profanity"]
        else filteredWords = [];

    });
}


document.addEventListener("storageSettingsUpdate", (detail) => {
    const keys = Object.keys(detail["detail"]);

    if (keys.includes(config.profanityFilterToggle.getName()) || keys.includes(config.sexualFilterToggle.getName())) {
        updateFilteredWords();
    }

});

document.addEventListener("chatStarted", () => {
    statusObserver.disconnect();
    statusObserver.observe(document.getElementsByClassName("logbox")[0], {attributes: true, subtree: true, childList: true});

    $(".chatmsg").off().on("input", (event) => {
        $(event.target).val(filterString($(event.target).val(), filteredWords));
    });

});



let statusObserver = new MutationObserver((mutationRecord) => {


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

let filterString = (message, filteredWords) => {

    for (let word of filteredWords) {
        message = message.replaceAll(word, "*".repeat(word.length))
    }

    return message;

}

