let ConstantValues = {
    discordURL: "https://discord.com/invite/TRCNZ5vuwM",
    geoLocationEndpoint: "https://freegeoip.app/json/"
}

class SettingsManager {
    #menu = new SettingsMenu();

    constructor() {

        // Assign button function
        $(ButtonManager.menuButton).on("click", () => {
            this.#menu.enable();
        })



    }

}

class MutableField {
    #storageName;
    #default;
    #type;

    constructor(config) {
        this.#storageName = config["storageName"]
        this.#default = config["default"] || null;
        this.#type = config["type"];
    }

    updateValue(config) {
        if (!config["confirm"] || config["confirm"] === "false" || config["confirm"] === false) return;
        const override = {}
        override[this.#storageName] = config["value"]
        chrome.storage.sync.set(override);
    }

    getType() {
        return this.#type;
    }

    getDefault() {
        return this.#default;

    }
    getName() {
        return this.#storageName
    }


}


class ToggleEdit extends MutableField {
    #elementName;

    constructor(config) {
        config["type"] = "toggle";
        super(config)
        this.#elementName = config["elementName"];
    }

    update(noChange = false) {
        const name = this.getName();
        const request = {}
        let newResult;
        request[name] = this.getDefault();
        chrome.storage.sync.get(request, (result) => {
           if (noChange) {
               newResult = result[name];
           } else {
               newResult = result[name] === "true" ? "false" : "true";
           }
           this.updateValue({"confirm": "true", "value": newResult});
            document.dispatchEvent(new CustomEvent("ToggleModify", {
                detail: {
                    "element": this.#elementName,
                    "value": newResult
                }
            }));
        });
    }

}

class FieldEdit extends MutableField {
    #prompt;
    #check;
    #defaultCheck = () => true;

    constructor(config) {
        config["type"] = "field";
        super(config);
        this.#prompt = config["prompt"];
        this.#check = config["check"] || this.#defaultCheck;
    }

    getResponse(previous) {
        return prompt(this.#prompt, previous);
    }

    update() {
        const name = this.getName();
        const request = {}
        request[name] = this.getDefault();
        chrome.storage.sync.get(request, (result) => {
            const response = this.getResponse(result[name]);
            this.updateValue(this.#check(response));
        })
    }

}
