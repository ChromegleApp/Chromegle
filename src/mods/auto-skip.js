class AutoSkipManager extends Module {

    #doSkip = true;

    constructor() {
        super();
        this.addEventListener("chatSeenTimes", this.onChatSeenTimes);
    }

    createSkipLogItem(secondsLeft, chatUUID) {

        let logItem = $(`<div id="${chatUUID}-skip-logitem" class="logitem">`).get(0);
        let skipLabel = $(`<span id="${chatUUID}-skip-statuslog" class='statuslog'>${this.#skipMessage(secondsLeft)}</span>`).get(0);
        let afterLabel  = $(`<span class="statuslog"> for this chat.</span>"`).get(0);

        logItem.appendChild(skipLabel);
        logItem.append(this.createCancelSkipButton());
        logItem.append(afterLabel);

        return logItem;

    }

    createCancelSkipButton() {
        return (
            $(`<span class="statuslog chromegle-cancel-skip">cancel skipping</span>`)
                .on("click", this.onCancelSkipButtonClick.bind(this))
                .get(0)
        );
    }

    #skipMessage(secondsLeft) {
        return (
            `Auto-skip is enabled. Skipping in ${secondsLeft} `
             + `second${secondsLeft > 1 || secondsLeft === 0 ? 's' : ''} from now unless you `
        );
    }

    onCancelSkipButtonClick() {
        if (!ChatRegistry.isChatting) {
            return;
        }

        // Cancel the skip
        this.#doSkip = false;
        $(`#${ChatRegistry.getUUID()}-skip-logitem`).get(0).innerHTML = (
            "<p class=statuslog>Canceled auto-skip until your next conversation, enjoy the rest of your chat.</p>"
        );

    }

    async onChatStarted() {

        this.#doSkip = true;

        if (!(await config.autoSkipToggle.retrieveValue() === "true")) {
            return;
        }

        // Add skip text
        let skipSeconds = await config.autoSkipDelayField.retrieveValue();
        let chatUUID = ChatRegistry.getUUID();
        let innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
        innerLogBox.appendChild(this.createSkipLogItem(skipSeconds, chatUUID));

        let interval = setInterval(() => {

            // Chat ended
            if (chatUUID !== ChatRegistry.getUUID() || !this.#doSkip) {
                clearInterval(interval);
                return;
            }

            if (skipSeconds <= 0) {
                AutoSkipManager.skipIfPossible();
                clearInterval(interval);
                return;
            }

            // Update text
            skipSeconds--;
            $(`#${chatUUID}-skip-statuslog`).get(0).innerHTML = this.#skipMessage(skipSeconds);

        }, 1000);
    }

    onChatEnded(event) {
        $(`#${event.detail.uuid}-skip-logitem`).remove();
    }

    async onChatSeenTimes(event) {
        let seenBeforeTimes = await config.skipRepeatsToggle.retrieveValue();

        if (seenBeforeTimes !== "true") {
            return;
        }

        const seenTimes = event["detail"]["seenTimes"];

        if (seenTimes > 0) {
            Logger.INFO(
                "Skipped chat with UUID <%s> on event <%s> because the user has been seen <%s> time(s) before and <%s> is enabled.",
                event["detail"]["uuid"], "chatSeenTimes", seenTimes, config.skipRepeatsToggle.getName()
            );
            sendErrorLogboxMessage(`Skipped user with IP ${event["detail"]["ipAddress"]} as you have seen them before.`);
            AutoSkipManager.skipIfPossible();
        }

    }


    static skipIfPossible(tries) {
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
    }

    static startIfPossible(tries) {
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




