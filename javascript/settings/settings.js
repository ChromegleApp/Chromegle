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


class SwitchEdit extends MutableField {
    #elementName;
    #otherElementNames;
    #value;

    getValue() {
        return this.#value;
    }

    constructor(config) {
        config["type"] = "switch";
        super(config)
        this.#value = config["value"];
        this.#elementName = config["elementName"];
        this.#otherElementNames = config["otherElementNames"];
    }

    getElementName() {
        return this.#elementName;
    }

    update(noChange = false) {
        let currentQuery = {}
        currentQuery[this.getName()] = this.getDefault();

        chrome.storage.sync.get(currentQuery, (result) => {
            const currentlySelected = result[this.getName()] === this.#elementName;

            // No Change Requested
            if (noChange) {

                // Is currently Selected, change to display selection
                if (currentlySelected) {
                    document.dispatchEvent(new CustomEvent("SwitchModify", {
                        detail: {
                            "element": this.#elementName,
                            "others": this.#otherElementNames,
                            "change": false
                        }
                    }));
                }

                // Is not selected, don't display
                return;
            }

            // Not currently Selected
            if (!currentlySelected) {
                this.updateValue({"confirm": "true", "value": this.#elementName});

                document.dispatchEvent(new CustomEvent("SwitchModify", {
                    detail: {
                        "element": this.#elementName,
                        "others": this.#otherElementNames,
                        "change": true
                    }
                }));
            }


        });

    }

}

class ThemeSwitchEdit extends SwitchEdit {
    constructor(config) {
        super(config);

        document.addEventListener("SwitchModify", (response) => {
            const elementName = response["detail"]["element"];
            if (this.getElementName() === elementName) {
                if (response["detail"]["change"]) {
                    window.location.reload();
                }
            }

        });

    }
}

class ToggleEdit extends MutableField {
    #elementName;

    constructor(config) {
        config["type"] = "toggle";
        super(config)
        this.#elementName = config["elementName"];
    }

    getElementName() {
        return this.#elementName;
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
                    "value": newResult,
                    "change": !noChange
                }
            }));
        });
    }

}

class ThemeToggleEdit extends ToggleEdit {
    constructor(config) {
        super(config);

        document.addEventListener("ToggleModify", (response) => {
            if (response["detail"]["change"] && response["detail"]["element"] === this.getElementName()) {
                window.location.reload();
            }

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
