let filterNSFWImages = "false";

function updateFilterStatus() {
    let filterQuery = {}
    filterQuery[config.sexualVideoFilterToggle.getName()] = config.sexualVideoFilterToggle.getDefault();

    chrome.storage.sync.get(filterQuery, (result) => {
            filterNSFWImages = result[config.sexualVideoFilterToggle.getName()] || "false";
    });
}

document.addEventListener("pageStarted", () => updateFilterStatus())
document.addEventListener("storageSettingsUpdate", (event) => {
    const keys = Object.keys(event["detail"]);

    if (keys.includes(config.sexualVideoFilterToggle.getName())) {
        filterNSFWImages = event["detail"][config.sexualVideoFilterToggle.getName()]
    }
})

document.addEventListener("videoChatLoaded", () => {

    // Enabled or not
    if (filterNSFWImages !== "true") {
        return;
    }

    // Block pre-emptively, without text
    otherVideoBlocker.blockVideo(false);

    // Get other video
    const otherVideo = $("#othervideo").get(0)
    console.log(otherVideo.src)

    const screenshot = VideoScreenshot._screenshotVideo(otherVideo);
    if (screenshot === null) return;

    // Create payload
    const payload = {
        base64: screenshot
            .toDataURL()
            .split("data:image/png;base64,")[1]
    };

    // Make Request
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${ConstantValues.apiURL}/nsfw`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(payload));
    xhr.timeout = 1500;

    // Handle Response
    xhr.onload = () => {
        let json = JSON.parse(xhr.response)
        if (json["status"] !== 1) return;
        if (json["data"]["is_nsfw"] === true) {
            Logger.INFO("Detected NSFW video of <%s> with chat UUID <%s>", otherVideo.id, ChatRegistry.getUUID());
            sendNSFWMessage("Detected NSFW video input, blocked the screen!");
            otherVideoBlocker.blockVideo(true);
            return;
        }
        otherVideoBlocker.unblockVideo();
    };

    xhr.ontimeout = () => {
        otherVideoBlocker.unblockVideo();
        sendNSFWMessage("NSFW detection timed out, unblocked video to preserve chat.")
    }
});

function sendNSFWMessage(message) {
    const innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
    const seenBeforeDiv = document.createElement("div")
    seenBeforeDiv.classList.add("logitem");
    seenBeforeDiv.appendChild($(`<span style="color: red;" class='statuslog'>${message}</span>`).get(0));
    innerLogBox.append(seenBeforeDiv);
}
