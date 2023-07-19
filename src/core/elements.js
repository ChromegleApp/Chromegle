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
        storedData[hashedAddress] = newValue;
        let storageQuery = {[this.NOTE_STORAGE_ID]: JSON.stringify(storedData)};
        await chrome.storage.local.set(storageQuery);

        Logger.DEBUG(`Set note for ${hashedAddress} to: <%s>`, newValue);
    }

    async onNoteClick() {

        let newValue = prompt("Set a new value for the note:");
        if (newValue == null) {
            return;
        }

        // Set new value
        let hashedAddress = this.element.getAttribute("ip-address");
        await this.setNote(hashedAddress, newValue);

        // Update element
        this.element.innerText = this.formatNote(newValue);

    }


}


// Probably leaks memory
class Spoiler {

    element = undefined;

    constructor(string) {
        this.string = string;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement("span");
        this.element.innerText = this.string;
        this.element.classList.add("chromegle-spoiler");
        this.element.addEventListener("click", this.onClick.bind(this));
    }

    onClick() {
        this.element.classList.add("show");
        document.removeEventListener("click", this.onClick);
    }

    get() {
        return this.element;
    }

    getHTML() {
        return this.element.outerHTML;
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
