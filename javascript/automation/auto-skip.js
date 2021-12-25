function skipIfPossible() {
    if (!($(".chatmsg").get(0).classList.contains("disabled"))) {
        $(".disconnectbtn")
            .trigger("click")
            .trigger("click");
    }

}

document.addEventListener("chatStarted", (detail) => {

    let skipQuery = {};
    const uuid = detail["detail"]["uuid"];

    skipQuery[config.autoSkipToggle.getName()] = config.autoSkipToggle.getDefault();
    skipQuery[config.autoSkipDelayField.getName()] = config.autoSkipDelayField.getDefault();

    chrome.storage.sync.get(skipQuery, (result) => {

        if (result[config.autoSkipToggle.getName()] === "true") {

            setTimeout(() => {

                if (uuid !== ChatRegistry.getUUID()) {
                    return;
                }

                skipIfPossible();

            },  result[config.autoSkipDelayField.getName()] * 1000);

        }
    });

});

document.addEventListener("chatSeenTimes", (event) => {

    let seenBeforeQuery = {};
    seenBeforeQuery[config.skipRepeatsToggle.getName()] = config.skipRepeatsToggle.getDefault();

    chrome.storage.sync.get(seenBeforeQuery, (result) => {

        if (result[config.skipRepeatsToggle.getName()] === "true") {

            const seenTimes = event["detail"]["seenTimes"];
            if (seenTimes > 0) {
                Logger.INFO(
                    "Skipped chat with UUID <%s> on event <%s> because the user has been seen <%s> time(s) before and <%s> is enabled.",
                    event["detail"]["uuid"], "chatSeenTimes", seenTimes, config.skipRepeatsToggle.getName()
                );
                sendNSFWMessage(`Skipped user with IP ${event["detail"]["ipAddress"]} as you have seen them before.`);
                skipIfPossible();
            }

        }

    });

});
