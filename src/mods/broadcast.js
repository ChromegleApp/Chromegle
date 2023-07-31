class BroadcastManager extends Module {

    static mobileSupported = false;

    STORAGE_ID = "BROADCAST_MESSAGE_LIST";
    STORAGE_DEFAULT = "[]";

    CHECK_INTERVAL = 60 * 3 * 1000;
    EXEC_INTERVAL = 15 * 1000;

    SESSION_ID = shortUuid()
        .toUpperCase()
        .replaceAll("I", "L")
        .replaceAll(/[O0]/g, "M");

    checkInterval;
    execInterval;

    #broadcasts = [];

    addSessionToButton() {

        $(".disconnectbtn > .btnkbshortcut")
            .text(this.SESSION_ID)
            .attr("id", "broadcast-id");

    }

    onDisconnectButtonMutation(event) {
        let mutationRecord = event.detail;

        let addedShortcut = mutationRecord.addedNodes[0]?.classList?.contains('btnkbshortcut');

        // Node added
        if (addedShortcut) {
            return;
        }

        // Ok, add it!
        this.addSessionToButton();

    }

    onPageStarted() {

        // Session button
        this.addEventListener('disconnectBtnMutation', this.onDisconnectButtonMutation);
        this.addEventListener('click', this.onClick);
        this.addSessionToButton();

        // Check for new broadcasts
        this.checkBroadcasts();
        this.checkInterval = setInterval(
            this.checkBroadcasts.bind(this),
            this.CHECK_INTERVAL
        );

        // Execute received broadcasts
        this.execInterval = setInterval(
            this.execBroadcast.bind(this),
            this.EXEC_INTERVAL
        )

    }

    checkBroadcasts() {
        fetch(this.statics.apiURL + "broadcasts", {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(async (res) => {
                let alreadyPulled = await this.getPreviousBroadcasts();
                let newlyPulled = [];

                for (let broadcast of res['broadcasts']) {
                    if (this.matchesTarget(broadcast) && !alreadyPulled.includes(broadcast.id)) {
                        this.#broadcasts.unshift(broadcast);
                        newlyPulled.push(broadcast.id);
                        Logger.DEBUG("Received new broadcast:\n\n%s", JSON.stringify(broadcast));
                    }
                }

                await this.addPreviousBroadcast(alreadyPulled, newlyPulled);
            });
    }

    matchesTarget(broadcast) {
        return broadcast.target.toLowerCase() === "all" || broadcast.target === this.SESSION_ID;
    }

    async addPreviousBroadcast(previousBroadcasts, newBroadcasts) {

        // Hard-reset after 100
        if (previousBroadcasts.length > 100) {
            previousBroadcasts = [];
        }

        let previous = [...previousBroadcasts, ...newBroadcasts];
        let query = {[this.STORAGE_ID]: JSON.stringify(previous)};
        await chrome.storage.local.set(query);
    }

    async getPreviousBroadcasts() {
        let query = {[this.STORAGE_ID]: this.STORAGE_DEFAULT};
        let broadcasts = await chrome.storage.local.get(query);
        return  JSON.parse(broadcasts[this.STORAGE_ID]);
    }

    async execBroadcast() {

        if (this.#broadcasts.length < 1) {
            return;
        }

        // Remove previous
        document.getElementById("broadcast")?.remove();

        // {id: <uuid>, message: <str>}
        let broadcast = this.#broadcasts.pop();
        let element = this.createBroadcast(broadcast.message, broadcast.id);
        document.body.appendChild(element);

        // Remove after 10 seconds
        setTimeout(this.closeLogo.bind(this), 10 * 1000);

    }

    closeLogo() {
        $("#broadcast")
            .css("opacity", "0")
            .css("pointer-events", "none")
    }

    onClick(event) {
        if (event.target.id !== "broadcast-close-btn") {
            return;
        }

        this.closeLogo();
    }

    createBroadcast(message, id) {
        return $(`
            <div id="broadcast" itemid="${id}">
                <div id="broadcast-close-btn" class="broadcase-close">✕</div>
                <div class="broadcast-title noselect">Chromegle Broadcast</div>
                <div class="broadcast-msg noselect">${message}</div>
            </div>
        `).get(0);
    }

}

