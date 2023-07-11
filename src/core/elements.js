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
        this.element.addEventListener("click", this.onClick.bind(this))
    }

    onClick() {
        this.element.classList.add("show");
        document.removeEventListener("click", this.onClick);
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
