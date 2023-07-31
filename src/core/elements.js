function ReSpoiler(string) {
    let element = document.createElement("button");
    element.innerText = string;
    element.classList.add("chromegle-spoiler");
    element.classList.add("clickable");
    return element;
}

class Note {

    NOTE_STORAGE_ID = "NOTE_STORAGE_JSON";
    NOTE_STORAGE_DEFAULT = "{}";

    element = undefined;

    emptyText = "Click to add a profile note";
    emptyClass = "empty";
    baseClass = "chromegle-note";

    formatNote(noteText) {
        return `"${noteText}"`
    }

    async setup(hashedAddress) {

        this.element = document.createElement("span");
        this.element.classList.add(this.baseClass);
        this.element.setAttribute("ip-address", hashedAddress);

        // Get text
        let storedText = await this.getNote(hashedAddress);

        if (storedText && storedText.length > 0) {
            this.element.innerText = this.formatNote(storedText);
            this.element.classList.remove(this.emptyClass);
        } else {
            this.element.innerText = this.emptyText;
        }

        this.element.addEventListener("click", this.onNoteClick.bind(this));

    }

    async getStorageData() {
        let storageQuery = {[this.NOTE_STORAGE_ID]: this.NOTE_STORAGE_DEFAULT};
        let storedData = (await chrome.storage.local.get(storageQuery))[this.NOTE_STORAGE_ID];
        return JSON.parse(storedData || this.NOTE_STORAGE_DEFAULT);
    }

    async getNote(hashedAddress) {
        let storedData = await this.getStorageData();
        return storedData[hashedAddress] || null;
    }

    async setNote(hashedAddress, newValue) {

        let storedData = await this.getStorageData();

        if (newValue == null) {
            try {
                delete storedData[hashedAddress]
            } catch (ex) {

            }
        } else {
            storedData[hashedAddress] = newValue;
        }

        let storageQuery = {[this.NOTE_STORAGE_ID]: JSON.stringify(storedData)};
        await chrome.storage.local.set(storageQuery);

        Logger.DEBUG(`Set note for ${hashedAddress} to: <%s>`, newValue);
    }

    async onNoteClick() {

        let newValue = prompt("Set a new value for the note:");
        if (newValue == null) {
            return;
        }

        if (newValue.length === 0) {
            newValue = null;
            this.element.innerText = this.emptyText;
        } else {
            this.element.innerText = this.formatNote(newValue);
        }

        // Set new value
        let hashedAddress = this.element.getAttribute("ip-address");
        await this.setNote(hashedAddress, newValue);

    }


}

class IPAddressSpoiler {

    element = undefined;
    STORAGE_ID = "IP_SPOILER_HIDDEN_TOGGLE";
    STORAGE_DEFAULT = true;

    constructor(string) {
        this.string = string;
    }

    async isHidden() {
        let hiddenQuery = {[this.STORAGE_ID]: this.STORAGE_DEFAULT};
        return (await chrome.storage.sync.get(hiddenQuery))[this.STORAGE_ID];
    }

    async setIsHidden(hiddenValue)  {
        let hiddenQuery = {[this.STORAGE_ID]: hiddenValue};
        await chrome.storage.sync.set(hiddenQuery);
    }

    async setup() {

        // Element setup
        this.element = document.createElement("span");
        this.element.innerText = this.string;
        this.element.classList.add("chromegle-spoiler");
        this.element.addEventListener("click", this.onClick.bind(this));
        this.element.addEventListener("mousedown", this.onMouseDown.bind(this), false);

        // Set hidden status
        this.setElementHidden(await this.isHidden());

        return this;

    }

    async onClick() {

        let isHidden = await this.isHidden();
        await this.setIsHidden(!isHidden);
        this.setElementHidden(!isHidden);

    }

    /**
     * Prevents selecting
     * https://stackoverflow.com/questions/880512/prevent-text-selection-after-double-click
     */
    onMouseDown(event) {
        event.preventDefault();
    }

    setElementHidden(isHidden) {
        if (isHidden) {
            this.element.classList.remove("show");
        } else {
            this.element.classList.add("show");
        }
    }

    get() {
        return this.element;
    }

}

class ChatUpdateClock {

    #updateFunctions;

    constructor(chatUUID, updateInterval) {
        this.updateInterval = updateInterval;
        this.chatUUID = chatUUID;
        this.interval = setInterval(this.onInterval.bind(this), this.updateInterval);
        this.#updateFunctions = [];
        this.startTime = new Date();
        this.currentTime = this.startTime;
    }

    cancel() {
        clearInterval(this.interval);
    }

    addUpdate(func) {
        this.#updateFunctions.push(func);
    }

    onInterval() {

        if (ChatRegistry.getUUID() !== this.chatUUID) {
            this.cancel();
            return;
        }

        this.currentTime = new Date();
        for (let func of this.#updateFunctions) {
            func(this.currentTime, this.startTime);
        }

    }

}

function EmbeddedLink(url) {

    let element = document.createElement("a");
    element.target = "_blank";
    element.href = url;
    element.innerHTML = url;
    element.classList.add(LinkEmbedManager.linkClass);
    return element;

}

class ChromeStoredElement {

    constructor(storageId, storageDefault, storageArea = "sync") {
        this.id = storageId;
        this.default = storageDefault;
        this.storageArea = storageArea;
    }

    async retrieveValue() {
        let query = {[this.id]: this.default};
        return ((await chrome.storage[this.storageArea].get(query)) || {})[this.id];
    }

    async setValue(newValue) {
        let query = {[this.id]: newValue};
        await chrome.storage[this.storageArea].set(query);
    }

}