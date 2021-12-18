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

                if (!($(".chatmsg").get(0).classList.contains("disabled"))) {
                    $(".disconnectbtn")
                        .trigger("click")
                        .trigger("click");
                }

            },  result[config.autoSkipDelayField.getName()] * 1000);

        }
    });

});