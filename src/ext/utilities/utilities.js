function getResourceURL(path) {
    return `chrome-extension://${chrome.runtime.id}/` + path
}

const isNumeric = (str) => {
    if (typeof str != "string") return false // we only process strings!
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

const shortUuid = () => {
    return Math.random().toString(36).slice(-6);
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

function isValidHttpsUrl(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "https:";
}

function runDataLoaders(...loaders) {

    (async() => null)().then(async () => {
        for (let loader of loaders) {
            try {
                await (new loader().run());
            } catch (ex) {
                Logger.ERROR("A data loader failed to run, stack-trace below:");
                throw ex;
            }
        }
    });

}


function loadModules(...modules) {
    modules.forEach((manager) => {
        try {
            manager.initialize();
        } catch (ex) {
            Logger.ERROR("A module failed to initialize, stack-trace below:");
            throw ex;
        }
    })
}

async function fetchWithTimeout(resource, options = {}) {
    const {timeout = 8000} = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);

    return response;
}


function sendErrorLogboxMessage(message) {
    const innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
    const seenBeforeDiv = document.createElement("div")
    seenBeforeDiv.classList.add("logitem");
    seenBeforeDiv.appendChild($(`<span style="color: red;" class='statuslog'>${message}</span>`).get(0));
    innerLogBox.append(seenBeforeDiv);
    return seenBeforeDiv;
}


function sendInfoLogboxMessage(message, elementId) {

    const innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
    const seenBeforeDiv = document.createElement("div");
    seenBeforeDiv.classList.add("logitem");

    let idStr = elementId ? `id="${elementId}"` : "";
    let statusLog = $(`<span ${idStr} class='statuslog'>${message}</span>`).get(0);

    seenBeforeDiv.appendChild(statusLog);
    innerLogBox.append(seenBeforeDiv);

    return seenBeforeDiv;

}

function isMobile() {
    return Boolean(document.querySelector('[href*="/static/mobile.css"]'));
}

function isValidIPv4(address) {
    return (
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/g
    ).test(address);

}

function isValidIPv6(address) {
    return (
        /^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$/g
    ).test(address);
}

function isValidIP(address) {
    return isValidIPv4(address) || isValidIPv6(address);
}


