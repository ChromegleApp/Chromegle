class WhitelistElement extends ChromeStoredElement {

    async contains(address) {
        let current = JSON.parse(await this.retrieveValue());
        return Boolean(current[address]);
    }

    async add(address) {
        let current = JSON.parse(await this.retrieveValue());

        if (current[address] !== undefined) {
            return false;
        }

        current[address] = Math.floor(Date.now() / 1000);
        await this.setValue(JSON.stringify(current));
        return true;
    }

    async remove(address) {
        let current = JSON.parse(await this.retrieveValue());

        if (current[address] === undefined) {
            return false;
        }

        delete current[address];
        await this.setValue(JSON.stringify(current));
        return true;
    }

}

class RepeatSkipManager extends Module {

    #ipAddress;
    #uuid;

    #whitelist = new WhitelistElement(
        "AUTO_SKIP_WHITELIST",
        "{}",
        "local"
    )

    async onChatSeenTimes(event) {
        this.#ipAddress = event.detail.ipAddress;
        this.#uuid = event.detail.uuid;

        let skipRepeatsEnabled = await config.skipRepeatsToggle.retrieveValue();

        // Module must be enabled & they must have been seen before
        if (skipRepeatsEnabled !== "true") {
            return;
        }

        // Auto-skip multiples
        if (event.detail.seenTimes < 1) {
            let whitelistLogItem = this.createWhitelistLogItem(this.#uuid);
            let innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
            innerLogBox.appendChild(whitelistLogItem);
            return;
        }

        // Whitelisted user
        if (await this.#whitelist.contains(this.#ipAddress)) {
            let unWhitelistLogItem = this.createUnWhitelistLogItem(this.#uuid);
            let innerLogBox = document.getElementsByClassName("logitem")[0].parentNode;
            innerLogBox.appendChild(unWhitelistLogItem);
            return;
        }

        // Skip this repeated user
        this.#skipRepeat(event, event.detail.seenTimes);

    }

    createWhitelistLogItem(chatUUID) {

        let logItem = $(`<div id="${chatUUID}-repeats-skip-logitem" class="logitem">`).get(0);
        let afterLabel  = $(`<span class="statuslog"> from the skip repeats tool in future chats.</span>"`).get(0);

        let skipLabel = $(`
            <span id="${chatUUID}-repeats-skip-statuslog" class='statuslog'>
                Click to
            </span>
        `).get(0);

        logItem.appendChild(skipLabel);
        logItem.append(this.createWhitelistSkipButton());
        logItem.append(afterLabel);

        return logItem;

    }

    createUnWhitelistLogItem(chatUUID) {

        let logItem = $(`<div id="${chatUUID}-repeats-skip-whitelisted-logitem" class="logitem">`).get(0);
        let afterLabel  = $(`<span class="statuslog"> from the skip repeats tool in future chats.</span>"`).get(0);

        let skipLabel = $(`
            <span id="${chatUUID}-repeats-skip-statuslog" class='statuslog'>
                Click to
            </span>
        `).get(0);

        logItem.appendChild(skipLabel);
        logItem.append(this.createUnWhitelistSkipButton());
        logItem.append(afterLabel);

        return logItem;
    }


    #skipRepeat(event, seenTimes) {
        Logger.INFO(
            "Skipped chat with UUID <%s> on event <%s> because the user has been seen <%s> time(s) before and <%s> is enabled.",
            event["detail"]["uuid"], "chatSeenTimes", seenTimes, config.skipRepeatsToggle.getName()
        );

        let element = sendErrorLogboxMessage(`Skipped user with IP ${event["detail"]["ipAddress"]} as you have seen them before.`);

        element.appendChild(
            this.createWhitelistSkipChatButton()
        );

        skipIfPossible();
    }

    async onWhitelistUserButtonClick(_, manual = false) {

        if (!confirm('Are you sure you want to whitelist this user?')) {
            return;
        }

        if (!this.#ipAddress) {
            alert('Whitelist failed due to an error: IP address is not tracked. Contact support.');
            return;
        }

        let addedToWhitelist = await this.#whitelist.add(this.#ipAddress);

        // Should never happen
        if (!addedToWhitelist) {
            return;
        }

        // Log message
        sendErrorLogboxMessage(`Whitelisted ${this.#ipAddress} from being repeat-skipped in future chats`);
        Logger.INFO(`Whitelisted <%s> from being repeat-skipped in future chats`, this.#ipAddress);

        // Don't do this if manually invoked
        if (manual) {
            document.getElementById(`${this.#uuid}-whitelist-repeats-chat-button`)?.replaceWith(
                this.createUnWhitelistSkipChatButton()
            )
            return;
        }

        // Replace message
        document.getElementById(`${this.#uuid}-repeats-skip-logitem`)?.replaceWith(
            this.createUnWhitelistLogItem(this.#uuid)
        );
    }

    async onUnWhitelistUserButtonClick(_, manual = false) {

        if (!confirm('Are you sure you want to un-whitelist this user?')) {
            return;
        }

        if (!this.#ipAddress) {
            alert('Un-whitelist failed due to an error: IP address is not tracked. Contact support.');
            return;
        }

        let removedFromWhitelist = await this.#whitelist.remove(this.#ipAddress);

        // Should never happen
        if (!removedFromWhitelist) {
            return;
        }

        // Log message
        sendErrorLogboxMessage(`Un-whitelisted ${this.#ipAddress}. They will be repeat-skipped in future chats.`);
        Logger.INFO(`Un-whitelisted <%s> from being repeat-skipped in future chats`, this.#ipAddress);

        if (manual) {
            document.getElementById(`${this.#uuid}-un-whitelist-repeats-chat-button`)?.replaceWith(
                this.createWhitelistSkipChatButton()
            )
            return;
        }

        // Replace message
        document.getElementById(`${this.#uuid}-repeats-skip-whitelisted-logitem`)?.replaceWith(
            this.createWhitelistLogItem(this.#uuid)
        );

    }

    createWhitelistSkipButton() {
        return (
            $(`<span class="statuslog chromegle-whitelist-skip">whitelist this user</span>`)
                .on("click", this.onWhitelistUserButtonClick.bind(this))
                .get(0)
        );
    }

    createWhitelistSkipChatButton() {
        return (
            $(`<span id="${this.#uuid}-whitelist-repeats-chat-button" class="statuslog chromegle-whitelist-skip-chat-button"> (Whitelist User)</span>`)
                .on("click", (e) => this.onWhitelistUserButtonClick(e, true)).bind(this)
                .get(0)
        );
    }

    createUnWhitelistSkipChatButton() {
        return (
            $(`<span id="${this.#uuid}-un-whitelist-repeats-chat-button" class="statuslog chromegle-whitelist-skip-chat-button"> (Un-whitelist User)</span>`)
                .on("click", (e) => this.onUnWhitelistUserButtonClick(e, true)).bind(this)
                .get(0)
        );
    }

    createUnWhitelistSkipButton() {
        return (
            $(`<span class="statuslog chromegle-un-whitelist-skip">un-whitelist this user</span>`)
                .on("click", this.onUnWhitelistUserButtonClick.bind(this, true))
                .get(0)
        );
    }

}
