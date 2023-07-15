const IPBlockingManager = {

    LOCAL_STORAGE_ID: "IP_BLOCK_CONFIG",
    DEFAULT_STORAGE_VALUE: [],

    initialize() {
        IPBlockingMenu.initialize()
    },

    async handleBlockedAddress(unhashedAddress) {

        let result = await IPBlockingManager.getStoredChromeConfigAsync();

        result = result[IPBlockingManager.LOCAL_STORAGE_ID];
        const skipChat = result.includes(unhashedAddress)

        if (skipChat) {
            Logger.INFO("Skipped blocked IP address <%s> with chat UUID <%s>", unhashedAddress, ChatRegistry.getUUID())
            sendErrorLogboxMessage(`Skipped the blocked IP address ${unhashedAddress}`)
                .appendChild(ButtonFactory.ipUnblockButton(unhashedAddress))
            AutoSkipManager.skipIfPossible();
        }

        return skipChat;

    },

    async getStoredChromeConfigAsync() {
        let blockQuery = {}
        blockQuery[IPBlockingManager.LOCAL_STORAGE_ID] = IPBlockingManager.DEFAULT_STORAGE_VALUE;
        return await chrome.storage.local.get(blockQuery);
    },

    getStoredChromeConfig(callback) {
        let blockQuery = {}
        blockQuery[IPBlockingManager.LOCAL_STORAGE_ID] = IPBlockingManager.DEFAULT_STORAGE_VALUE;
        chrome.storage.local.get(blockQuery, callback);
    },

    setStoredChromeConfig(newConfig) {
        if (newConfig == null) return;

        let blockQuery = {}
        blockQuery[IPBlockingManager.LOCAL_STORAGE_ID] = (newConfig || IPBlockingManager.DEFAULT_STORAGE_VALUE);

        chrome.storage.local.set(blockQuery);
    },

    unblockAddress(unhashedAddress, inChat = true) {
        const confirmUnblock = confirm(`Are you sure you want to unblock ${unhashedAddress}?`);
        if (!confirmUnblock) return false;

        IPBlockingManager.getStoredChromeConfig((result) => {
            result = result[IPBlockingManager.LOCAL_STORAGE_ID];

            if (result.includes(unhashedAddress)) {
                const index = result.indexOf(unhashedAddress);
                if (index > -1) result.splice(index, 1);

                IPBlockingManager.setStoredChromeConfig(result);

                if (inChat) {
                    Logger.INFO("Unblocked IP address <%s> in video chat", unhashedAddress)
                    sendErrorLogboxMessage(`Unblocked the IP address ${unhashedAddress} in video chat`
                    );
                }
            } else {
                alert(`The IP address ${unhashedAddress} is not blocked in video chat!`)
            }

        });

        return true;
    },

    blockAddress(unhashedAddress) {
        const confirmBlock = confirm(`Are you sure you want to block ${unhashedAddress}?`);
        if (!confirmBlock) return;

        IPBlockingManager.getStoredChromeConfig((result) => {
            result = result[IPBlockingManager.LOCAL_STORAGE_ID];

            if (!result.includes(unhashedAddress)) {
                result.push(unhashedAddress);
                IPBlockingManager.setStoredChromeConfig(result);

                Logger.INFO("Blocked IP address <%s> in video chat", unhashedAddress)
                sendErrorLogboxMessage(
                    `Blocked the IP address ${unhashedAddress}${ChatRegistry.isChatting() ? " and skipped the current chat" : ""}`
                ).appendChild(ButtonFactory.ipUnblockButton(unhashedAddress));
                if (ChatRegistry.isChatting()) {
                    AutoSkipManager.skipIfPossible();
                }
            } else {
                alert(`The IP address ${unhashedAddress} is already blocked in video chat!`)
            }

        });

    }


}


const IPBlockingMenu = {

    settingsModal: undefined,
    settingsModalElementId: "modal-2",

    initialize() {
        IPBlockingMenu.settingsModal = document.createElement("div");
        $(IPBlockingMenu.settingsModal).load(getResourceURL("public/html/blocked.html"));
        $("html").append(IPBlockingMenu.settingsModal)
    },

    _modifyIfEmpty(size) {
        if (size > 0) return;

        $(".ipListTable")?.get(0)?.appendChild($(`

                <tr>
                    <td class="ipListNumber"></td>
                    <td>You have not blocked anyone...</td>
                    <td></td>
                </tr>`).get(0));
    },

    _genEmptyTable() {
        return $(`

                <table class="ipListTable">
                  <tr>
                    <th style="width: 10%;">Number</th>
                    <th>IP Address</th>
                    <th>Action</th>
                  </tr>              
                </table>
`
        );
    },

    _buildEmptyTable(result, ipListTable) {
        for (let i = 0; i < result.length; i++) {

            ipListTable.get(0).appendChild($(`

                <tr>
                    <td class="ipListNumber">${i + 1}.</td>
                    <td>${result[i]}</td>
                    <td><button class="ipListTableUnblockButton" value="${result[i]}">Unblock</button></td>
                </tr>`).get(0))
        }

    },

    _onUnblockButtonClick(event) {
        let confirmed = IPBlockingManager.unblockAddress(event.target.value, false);
        if (!confirmed) return;


        $(event.target).closest("tr").remove();

        let results = $(".ipListTable").find(".ipListNumber");

        results.each((item) => {
            results.get(item).innerHTML = `${item + 1}.`
        });

        Logger.INFO("Unblocked IP address <%s> in video chat", event.target.value)
        IPBlockingMenu._modifyIfEmpty(document.getElementsByClassName("ipListNumber").length);
    },

    unblockAll(noChange) {
        if (noChange) return;

        const confirmUnblock = confirm(`Are you sure you want to unblock all IP addresses?`);
        if (!confirmUnblock) return;

        IPBlockingManager.setStoredChromeConfig([]);

        Logger.INFO("Unblocked all IP addresses in video chat")
        IPBlockingMenu._modifyIfEmpty(document.getElementsByClassName("ipListNumber").length);
    },

    loadMenu(noChange) {

        if (noChange) return;
        Settings.disable();
        IPBlockingMenu.enable();

        IPBlockingManager.getStoredChromeConfig((result) => {
            result = result[IPBlockingManager.LOCAL_STORAGE_ID];
            const ipListTable = IPBlockingMenu._genEmptyTable();
            IPBlockingMenu._buildEmptyTable(result, ipListTable);
            $("#blockedListDiv").get(0).innerHTML = $('<div>').append(ipListTable).html();
            $(".ipListTableUnblockButton").on(
                "click", (event) => IPBlockingMenu._onUnblockButtonClick(event)
            );
            IPBlockingMenu._modifyIfEmpty(result.length);

        });
    },

    enable() {
        MicroModal.show(IPBlockingMenu.settingsModalElementId)
    },

    disable() {
        MicroModal.hide(IPBlockingMenu.settingsModalElementId)
    },

}


