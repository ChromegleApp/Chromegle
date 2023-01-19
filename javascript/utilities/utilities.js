function getResourceURL(path) {
    return `chrome-extension://${chrome.runtime.id}/` + path
}

const isNumeric = (str) => {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

const uuid4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, uuid = c === 'x' ? r : (r & 0x3 | 0x8);
        return uuid.toString(16);
    });
}

async function sha1(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isPrivateAddress(ip) {
    let parts = ip.split('.');
    return parts[0] === '10' ||
        (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
        (parts[0] === '192' && parts[1] === '168');
}

function containsWord(array, word) {
    return array.some((element) => word.includes(element));
}

function checkImage(url, success, failure) {
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.send();
    request.onload = function () {
        status = request.status;
        if (request.status === 200) //if(statusText == OK)
        {
            success();
        } else {
            failure();
        }
    }
}

function isValidHttpsUrl(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "https:";
}
