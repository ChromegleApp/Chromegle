function getResourceURL(path) {
    return `chrome-extension://${chrome.runtime.id}/` + path
}

const isNumeric = (str) => {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}
