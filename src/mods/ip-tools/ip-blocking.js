class IPBlockList {

    #data = null;

    LOCAL_STORAGE_ID = "IP_BLOCK_LIST";
    DEFAULT_STORAGE_VALUE = "{}";

    async #get() {

        if (this.#data) {
            return this.#data;
        }

        let blockQuery = {[this.LOCAL_STORAGE_ID]: this.DEFAULT_STORAGE_VALUE};
        this.#data = JSON.parse((await chrome.storage.local.get(blockQuery))[this.LOCAL_STORAGE_ID]);
        return this.#data;
    }

    async #set(data) {
        this.#data = data;
        let blockQuery = {[this.LOCAL_STORAGE_ID]: JSON.stringify(data)};
        await chrome.storage.local.set(blockQuery);
    }

    async add(address) {
        let data = await this.#get();
        if (!address) return;

        data[address] = BlockedIP.toData(
            Math.floor(Date.now() / 1000)
        );

        await this.#set(data);

    }

    async getList() {
        return await this.#get();
    }

    async clearList() {
        let data = {};
        await this.#set(data);
    }

    async remove(address) {
        let data = await this.#get();
        if (!data) return;

        try {
            delete data[address]
        } catch (ex) {

        }

        await this.#set(data);
    }

    async isBlocked(address) {
        let data = await this.#get();
        return Boolean(data[address]);
    }

    async isEmpty() {
        return Object.keys(await this.#get()).length < 1;
    }

    async mergeWith(otherList) {
        let data = await this.#get();
        if (!data) return -1;

        let added = [];
        for (const [key, value] of Object.entries(otherList)) {

            if (data[key] !== undefined) {
                continue;
            }

            data[key] = value;
            added.push(key);

        }

        await this.#set(data);
        return added;

    }
}

class BlockedIP {

    #address;
    #timestamp;

    constructor(address, timestamp) {
        this.#address = address;
        this.#timestamp = timestamp;
    }

    static fromData(address, data = {}) {
        address = address.trim();

        // Check address
        if (!isValidIP(address)) {
            console.log('INVALID IP')
            return null;
        }

        // Validate timestamp
        if (!isNumeric(data?.timestamp?.toString()) || data?.timestamp > Math.floor(Date.now() / 1000)) {
            console.log('INVALID TIMESTAMP')
            return null;
        }

        return new BlockedIP(address, data.timestamp);

    }

    /**
     * Static method insures that we have a clear JSON blueprint in the future when we update.
     * In order to update the IPBlockList with new/changed info, this must be touched.
     * Future-proofs the JSON structure of data.
     */
    static toData(timestamp) {
        return {
            timestamp: timestamp
        }
    }

    toData() {
        return (
            BlockedIP.toData(
                this.#timestamp
            )
        )
    }

}


class IPBlockAPI {

    #blockList = new IPBlockList();

    async skipBlockedAddress(address) {

        let shouldSkip = await this.#blockList.isBlocked(address);

        if (shouldSkip) {
            Logger.INFO("Skipped blocked IP address <%s> with chat UUID <%s>", address, ChatRegistry.getUUID());
            sendErrorLogboxMessage(`Skipped the blocked IP address ${address}`)
                .appendChild(ButtonFactory.ipUnblockButton(address))
            AutoSkipManager.skipIfPossible();
        }

        return shouldSkip;

    }

    async unblockAddress(address, logInChat = true) {

        // Make sure they want to unblock
        if (!confirm(`Are you sure you want to unblock ${address}?`)) {
            return false;
        }

        // Check if blocked
        if (!await this.#blockList.isBlocked(address)) {
            alert(`The IP address ${address} is not blocked in video chat!`);
            return false;
        }

        // Remove
        await this.#blockList.remove(address);
        Logger.INFO("Unblocked IP address <%s> in video chat", address);

        // Log in chat
        if (logInChat) {
            sendErrorLogboxMessage(`Unblocked the IP address ${address} in video chat.`);
        }

        return true;
    }

    async blockAddress(address) {

        // Confirm
        if (!confirm(`Are you sure you want to block ${address}?`)) {
            return false;
        }

        // Check if blocked
        if (await this.#blockList.isBlocked(address)) {
            alert(`The IP address ${address} is already blocked in video chat!`);
            return true;
        }

        // Block the address
        await this.#blockList.add(address);
        Logger.INFO("Blocked IP address <%s> in video chat", address);

        // Skip if chatting
        let element;
        if (ChatRegistry.isChatting()) {
            AutoSkipManager.skipIfPossible();
            element = sendErrorLogboxMessage(`Blocked the IP address ${address} and skipped the current chat.`);
        } else {
            element = sendErrorLogboxMessage(`Blocked the IP address ${address}.`);
        }

        element.appendChild(ButtonFactory.ipUnblockButton(address));
        return true;

    }

    async retrieveBlockConfig() {
        return await this.#blockList.getList();
    }

    async clearBlockConfig(noChange) {
        if (noChange) return false;

        if (!confirm(`Are you sure you want to unblock all IP addresses?`)) {
            return false;
        }

        await this.#blockList.clearList();
        Logger.INFO("Unblocked all IP addresses in video chat");
    }

    async blockListIsEmpty() {
        return await this.#blockList.isEmpty();
    }

    async bulkAddBlockList(blockList) {
        return await this.#blockList.mergeWith(blockList);
    }


}

class IPBlockingMenu {

    settingsModal = null;
    elementId = "modal-2";

    constructor() {
        this.settingsModal = document.createElement("div");
        $(this.settingsModal).load(getResourceURL("public/html/blocked.html"));
        $("html").append(this.settingsModal);
    }

    async createTable() {
        let config = await IPBlockingManager.API.retrieveBlockConfig();

        // Get rows
        let rowsHTML;
        if (Object.keys(config).length > 0) {
            rowsHTML = this.#genTableRows(config).join("\n");
        } else {
            rowsHTML = this.genEmptyTableRow();
        }

        // Create table
        return $(`
            <table class="ipListTable" >
                <thead>
                    <tr>
                        <th>IP Address</th>
                        <th>Date Blocked</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody class="ipListTableBody">
                    ${rowsHTML}
                </tbody>
            </table>
        `).get(0);
    }

    genEmptyTableRow() {
        return (`
            <tr>
                <td></td>
                <td>You are not currently blocking anyone...</td>
                <td/>
            </tr>
                    
        `);
    }

    #getConfigEntries(config) {
        return Object
            .entries(config)
            .sort((a, b) => b[1].timestamp - a[1].timestamp);
    }

    #genTableRows(config) {
        let rows = [];

        for (const [address, data] of this.#getConfigEntries(config)) {
            rows.push(`
                <tr>
                    <td>${address}</td>
                    <td>${this.#timeStampToDate(data.timestamp)}</td>
                    <td><button class="ipUnblockMenuButton" value="${address}">Unblock</button></td>
                </tr>
            `);
        }

        return rows;

    }

    #timeStampToDate(timestamp) {
        let date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    enable(noChange) {
        if (noChange) return;
        Settings.disable();
        this.genTable();
    }

    genTable() {
        this.createTable().then((table) => {
            let anchor = document.getElementById("blockedListDiv");
            anchor?.childNodes?.[0]?.remove();
            anchor.appendChild(table);
            MicroModal.show(this.elementId);
        });
    }

    disable() {
        MicroModal.hide(this.elementId);
    }

}

class IPBlockingManager extends Module {

    static MENU = new IPBlockingMenu();
    static API = new IPBlockAPI();

    #menu = IPBlockingManager.MENU;
    #api = IPBlockingManager.API;

    constructor() {
        super();
        this.addEventListener("click", this.onButtonClick);
    }

    async onButtonClick(event) {

        if (event?.target?.classList?.contains("ipBlockButton")) {
            await this.onIpBlockButtonClick(event);
        }

        else if (event?.target?.classList?.contains("ipUnblockButton")) {
            await this.onIpUnblockButtonClick(event, true);
        }

        else if (event?.target?.classList?.contains("ipUnblockMenuButton")) {
            let unblocked = await this.onIpUnblockButtonClick(event, false);
            await this.onIpUnblockMenuButtonClick(event, unblocked);
        }

        else if (event?.target?.id === "importIpList") {
            await this.onIpImportListButtonClick(event);
        }

        else if (event?.target?.id === "exportIpList") {
            await this.onIpExportListButtonClick(event);
        }

    }

    async onIpImportListButtonClick(_) {

        // Receive data
        let json = prompt("Paste the JSON data to import:");
        let data;

        // Try parse
        try {
            data = JSON.parse(json);
        } catch (ex) {
        }

        // Confirm worked
        if (data == null) {
            return;
        }

        let sanitizedList = {};

        // Add them
        for (const [address, config] of Object.entries(data)) {

            let blockedIp = BlockedIP.fromData(address, config);

            if (blockedIp == null) {
                continue;
            }

            sanitizedList[address] = blockedIp.toData();
        }

        let originalLength = Object.keys(data).length;
        let sanitizedLength = Object.keys(sanitizedList).length;
        let importedList = await this.#api.bulkAddBlockList(sanitizedList);
        let importedLength = importedList.length;

        let duplicates = sanitizedLength - importedLength;
        let invalid = originalLength - sanitizedLength;

        // Log that it happened
        Logger.INFO(
            "Imported %s addresses of %s submitted to IP list <%s invalid, %s duplicate(s)>.",
            importedLength, originalLength, invalid, duplicates
        );

        let message = (
            `Imported ${importedLength} address of ${originalLength} into IP list` +
            ((invalid || duplicates) ? ` (${invalid} invalid, ${duplicates} duplicate${duplicates > 1 ? 's' : ''}).` : '!')
        )

        // Send alert
        alert(message);

        // Add them to the currently open menu
        this.#menu.genTable();
    }

    async onIpExportListButtonClick(_) {

        let text = JSON.stringify(await this.#api.retrieveBlockConfig());

        // Download the element
        const download = document.createElement("a");
        download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
        download.download = `IP-List-${new Date().toDateString()}.json`;
        download.click();
        download.remove();

        Logger.INFO("Exported IP address list as \"%s\"", download.download);

    }

    async onIpBlockButtonClick(event) {
        let blockValue = event.target.getAttribute("value");
        if (!blockValue) return;

        await this.#api.blockAddress(blockValue);
    }

    async onIpUnblockButtonClick(event, logInChat) {
        let unblockValue = event.target.getAttribute("value");
        if (!unblockValue) return false;

        return await this.#api.unblockAddress(unblockValue, logInChat);
    }

    async onIpUnblockMenuButtonClick(event, unblocked) {
        if (!unblocked) return;
        $(event?.target?.parentNode?.parentNode).remove();

        // Handle empty list
        if (await this.#api.blockListIsEmpty()) {
            let element = document.querySelector("tbody.ipListTableBody");
            if (element) element.innerHTML = this.#menu.genEmptyTableRow();
        }

    }

}

/*
TODO for IP blocking

- Handle imports & exports
- Confirm Unblock All works
- Page-ify IP block values
 */
