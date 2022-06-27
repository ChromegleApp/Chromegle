const AutoSkipManager = {

    skipMenu: null,
    doSkip: true,

    initialize() {
        AutoSkipManager._chatStarted();
        AutoSkipManager._chatSeenTimes();
    },

    _skipLabelString(secondsLeft) {
        return `Auto-skip is enabled. Skipping in ${secondsLeft} second${secondsLeft > 1 ? 's' : ''} from now unless you `;
    },

    _cancelSkip() {
        if (!ChatRegistry.isChatting()) return;
        AutoSkipManager.doSkip = false;
        $(`#${ChatRegistry.getUUID()}-logitem`).get(0).innerHTML = "<p class=statuslog>Canceled auto-skip until your next conversation, enjoy the rest of your chat.</p>";
    },

    /**
     * Auto-Skip (Time-Based)
     */
    _chatStarted() {
        document.addEventListener("chatStarted", () => {
            AutoSkipManager.doSkip = true;

            if (config.autoSkipToggle.getLocalValue() === "true") {

                const uuid = ChatRegistry.getUUID(),
                    skipSeconds = config.autoSkipDelayField.getLocalValue(),
                    innerLogBox = document.getElementsByClassName("logitem")[0].parentNode,
                    logItem = $(`<div id="${uuid}-logitem" class="logitem">`).get(0),
                    afterText = $(`<span class="statuslog"> for this chat.</span>"`);

                AutoSkipManager.skipMenu = $(`<span class='statuslog'>${AutoSkipManager._skipLabelString(skipSeconds)}</span>`).get(0);

                logItem.appendChild(AutoSkipManager.skipMenu);
                logItem.append(ButtonManager.autoSkipCancelButton.get(0));
                logItem.append(afterText.get(0));
                innerLogBox.appendChild(logItem);

                setTimeout(() => AutoSkipManager._skipLoop(skipSeconds, uuid), 0);

            }

        });
    },

    /**
     * Count down second-by-second until the skip
     * @param secondsLeft Seconds left until skip
     * @param uuid the uuid of the chat (cached)
     * @private N/A
     */
    _skipLoop(secondsLeft, uuid) {
        if (uuid !== ChatRegistry.getUUID() || !AutoSkipManager.doSkip) return;

        if (secondsLeft <= 0) {
            AutoSkipManager.skipIfPossible();
            $(AutoSkipManager.skipMenu).get(0).parentNode.remove();
            return;
        }

        AutoSkipManager.skipMenu.innerHTML = AutoSkipManager._skipLabelString(secondsLeft);
        secondsLeft -= 1;
        setTimeout(() => AutoSkipManager._skipLoop(secondsLeft, uuid), 1000);
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
                        VideoFilterManager.sendErrorMessage(`Skipped user with IP ${event["detail"]["ipAddress"]} as you have seen them before.`);
                        AutoSkipManager.skipIfPossible();
                    }

                }

            });

        });
    },

    /**
     * Skip Function, recursively called until skips up to 3 times
     */
    skipIfPossible(tries) {
        if (!($(".chatmsg").get(0).classList.contains("disabled"))) {
            $(".disconnectbtn")
                .trigger("click")
                .trigger("click");
        } else {
            tries = tries == null ? 0 : tries;
            if (tries < 3) {
                setTimeout(() => {
                    AutoSkipManager.skipIfPossible(tries++);
                }, 10);
            }
        }
    },

    startIfPossible(tries) {
        if (($(".chatmsg").get(0).classList.contains("disabled"))) {
            $(".disconnectbtn")
                .trigger("click")
        } else {
            tries = tries == null ? 0 : tries;
            if (tries < 3) {
                setTimeout(() => {
                    AutoSkipManager.skipIfPossible(tries++);
                }, 10);
            }
        }
    }

}




