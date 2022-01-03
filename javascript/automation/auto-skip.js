const AutoSkipManager = {

    initialize() {
        AutoSkipManager._chatStarted();
        AutoSkipManager._chatSeenTimes();
    },

    /**
     * Auto-Skip (Time-Based)
     */
    _chatStarted() {
        document.addEventListener("chatStarted", () => {
            const uuid = ChatRegistry.getUUID();

            if (config.autoSkipToggle.getLocalValue() === "true") {

                setTimeout(() => {
                    if (uuid !== ChatRegistry.getUUID()) return;
                    AutoSkipManager.skipIfPossible();
                },  config.autoSkipDelayField.getLocalValue() * 1000);

            }

        });
    },

    /**
     * Skip Repeats
     */
    _chatSeenTimes() {
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
                        VideoFilterManager.sendNSFWMessage(`Skipped user with IP ${event["detail"]["ipAddress"]} as you have seen them before.`);
                        AutoSkipManager.skipIfPossible();
                    }

                }

            });

        });
    },

    /**
     * Skip Function
     */
    skipIfPossible() {
        if (!($(".chatmsg").get(0).classList.contains("disabled"))) {
            $(".disconnectbtn")
                .trigger("click")
                .trigger("click");
        }
    }

}




