

class TimerSkipManager extends Module {

    #doSkip = true;

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
        $(`#${ChatRegistry.getUUID()}-skip-logitem`).get(0).innerHTML = (`
            <p class=statuslog>
                Canceled auto-skip until your next conversation. Enjoy the rest of your chat!
            </p>
        `);

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
                skipIfPossible();
                clearInterval(interval);
                return;
            }

            // Update text
            skipSeconds--;
            $(`#${chatUUID}-skip-statuslog`).get(0).innerHTML = this.#skipMessage(skipSeconds);

        }, 1000);
    }

    onChatEnded(event) {
        //$(`#${event.detail.uuid}-skip-logitem`).remove();
    }

}




