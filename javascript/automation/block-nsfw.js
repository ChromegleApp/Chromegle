let filterNSFWImages = "false";
let lastRanUUID = null;

const spinner = $()

function updateFilterStatus() {
    let filterQuery = {}
    filterQuery[config.sexualVideoFilterToggle.getName()] = config.sexualVideoFilterToggle.getDefault();

    chrome.storage.sync.get(filterQuery, (result) => {
            filterNSFWImages = result[config.sexualVideoFilterToggle.getName()] || "false";
    });
}

document.addEventListener("chatEnded", () => $("#nsfwVideoSpinner").remove());
document.addEventListener("pageStarted", () => updateFilterStatus());
document.addEventListener("storageSettingsUpdate", (event) => {
    const keys = Object.keys(event["detail"]);

    if (keys.includes(config.sexualVideoFilterToggle.getName())) {
        filterNSFWImages = event["detail"][config.sexualVideoFilterToggle.getName()]
    }
});

document.addEventListener("videoChatLoaded", () => {

    // Enabled or not
    if (filterNSFWImages !== "true") {
        return;
    }

    // Already ran
    if (ChatRegistry.getUUID() === lastRanUUID) {
        Logger.WARNING("Received videoChatLoaded more than once for chat UUID <%s>, should investigate.", lastRanUUID);
        return;
    }

    lastRanUUID = ChatRegistry.getUUID();

    // Block pre-emptively, without text
    otherVideoBlocker.blockVideo(false);

    // Make a clone to "extend" the spinner
    const nsfwVideoSpinner = $("#othervideospinner").clone().css("display", "block").get(0);
    nsfwVideoSpinner.id = "nsfwVideoSpinner";
    $("#videowrapper").get(0).appendChild(nsfwVideoSpinner)

    // Get other video
    const otherVideo = $("#othervideo").get(0)

    const screenshot = VideoScreenshot._screenshotVideo(otherVideo);
    if (screenshot === null) return;

    // Create payload
    const payload = {
        base64: screenshot
            .toDataURL()
            .split("data:image/png;base64,")[1]
    };

    const chatUUID = ChatRegistry.getUUID();

    // Make Request
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${ConstantValues.apiURL}/omegle/classify_image`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(payload));
    xhr.timeout = 5000; // 5 second time-out

    // Handle Response
    xhr.onload = () => {
        $(nsfwVideoSpinner).remove();

        // Expired
        if (ChatRegistry.getUUID() !== chatUUID) return;

        let json = JSON.parse(xhr.response)
        if (json["status"] !== 200) {
            Logger.ERROR("Received status <%s> from web-server when running NSFW detection for chat UUID <%s>", json["status"], ChatRegistry.getUUID());
            sendNSFWMessage("NSFW detection received a bad response, unblocked video to preserve chat.");
            otherVideoBlocker.unblockVideo();
            return;
        }

        Logger.DEBUG(
            "Received NSFW detection data for chat UUID <%s> from web-server as the following JSON payload: \n\n%s",
            ChatRegistry.getUUID(),
            JSON.stringify(json["payload"], null, 2)
        );

        if (json["payload"]["is_nsfw"] === true) {
            Logger.INFO("Detected NSFW video of <#%s> with chat UUID <%s>", otherVideo.id, ChatRegistry.getUUID());
            sendNSFWMessage("Detected NSFW video input, blocked the screen!");
            otherVideoBlocker.blockVideo(true);
            return;
        }
        otherVideoBlocker.unblockVideo();
    };

    xhr.ontimeout = () => {
        $(nsfwVideoSpinner).remove();

        // Expired
        if (ChatRegistry.getUUID() !== chatUUID) return;

        otherVideoBlocker.unblockVideo();
        sendNSFWMessage("NSFW detection took too long, video unblocked to preserve chat. If you have bad connection, it may be best to disable NSFW detection.")
        Logger.WARNING("NSFW detection timed out, had to unblock video to preserve chat viewing")
    }

    xhr.onerror = () => {
        $(nsfwVideoSpinner).remove();

        // Expired
        if (ChatRegistry.getUUID() !== chatUUID) return;

        otherVideoBlocker.unblockVideo();
        Logger.ERROR("Received an error  when trying to receive NSFW detection data for chat UUID <%s>", ChatRegistry.getUUID());
        sendNSFWMessage("NSFW detection failed due to an internal error, unblocked video to preserve chat.")
    }

});

function sendNSFWMessage(message) {
    const innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
    const seenBeforeDiv = document.createElement("div")
    seenBeforeDiv.classList.add("logitem");
    seenBeforeDiv.appendChild($(`<span style="color: red;" class='statuslog'>${message}</span>`).get(0));
    innerLogBox.append(seenBeforeDiv);
}
