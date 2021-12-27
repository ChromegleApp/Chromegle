let ConstantValues = {
    discordURL: "https://discord.gg/KDqHBrZ2Yn",
    githubURL: "https://github.com/ChromegleApp/Chromegle",
    geoLocationEndpoint: "https://freegeoip.app/json/",
    apiURL: "https://chromegle.isaackogan.com",

    getHelpfulTip: () => {
        const helpfulTips = [
            "We hope you enjoy our extension as much as we enjoyed making it!",
            `Did you know that we have a discord server? Go <a target='_blank' href='${ConstantValues.discordURL}'>check it out</a> some time!`,
            "Removed Herobrine as of Chromegle v2.2!",
            "Tip: Taking advice from a Chrome extension is probably a bad idea.",
            "How much could a wood chuck chuck if a wood chuck could chuck wood?",
            `Did you know we're open sourced? You <a target='_blank' href="${ConstantValues.githubURL}">can see every line</a> of code for this app online, free!`
        ]

        return helpfulTips[[Math.floor(Math.random() * helpfulTips.length)]]
    }


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

document.addEventListener("storageSettingsUpdate", (event) => {
    Logger.INFO("Updated sync-storage configuration option on <%s> event: %s", event.type, JSON.stringify(event.detail))
});

class MutableField {
    #storageName;
    #default;
    #type;
    #warning;

    constructor(config) {
        this.#storageName = config["storageName"]
        this.#default = config["default"] || null;
        this.#type = config["type"];
        this.#warning = config["warning"];

    }

    updateValue(config) {
        if (!config["confirm"] || config["confirm"] === "false" || config["confirm"] === false) return false;
        const override = {}

        if (this.#warning != null) {

            if (this.#warning["state"] == null || this.#warning["state"] === config["value"]) {
                let result = confirm(this.#warning["message"] || null);

                // Cancel
                if (!result) {
                    this.update(true);
                    return false;
                }

            }

        }

        override[this.#storageName] = config["value"]
        chrome.storage.sync.set(override);
        document.dispatchEvent(new CustomEvent("storageSettingsUpdate", {detail: override}));
        return true;
    }

    update(noChange) {
        return null;
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
            if (!currentlySelected && !noChange) {
                let result = this.updateValue({"confirm": "true", "value": this.#elementName});

                if (result) {
                    document.dispatchEvent(new CustomEvent("SwitchModify", {
                        detail: {
                            "element": this.#elementName,
                            "others": this.#otherElementNames,
                            "change": true
                        }
                    }));
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

               document.dispatchEvent(new CustomEvent("ToggleModify", {
                   detail: {
                       "element": this.#elementName,
                       "value": newResult,
                       "change": !noChange
                   }
               }));

           } else {
               newResult = result[name] === "true" ? "false" : "true";
               let storageResult = this.updateValue({"confirm": "true", "value": newResult});

               if (storageResult) {

                   document.dispatchEvent(new CustomEvent("ToggleModify", {
                       detail: {
                           "element": this.#elementName,
                           "value": newResult,
                           "change": !noChange
                       }
                   }));
               }
           }

        });
    }

}

class FieldEdit extends MutableField {
    #prompt;
    #check;
    #defaultCheck = () => true;

    getPrompt() {
        return this.#prompt;
    }

    constructor(config) {
        config["type"] = "field";
        super(config);
        this.#prompt = config["prompt"];
        this.#check = config["check"] || this.#defaultCheck;
    }

    getResponse(previous) {
        return prompt(this.#prompt, previous);
    }

    update(noChange) {
        if (noChange) return;

        const name = this.getName();
        const request = {}
        request[name] = this.getDefault();
        chrome.storage.sync.get(request, (result) => {
            const response = this.getResponse(result[name]);
            this.updateValue(this.#check(response));
        })
    }

}

class MultiFieldEdit extends FieldEdit {
    #times;

    constructor(config) {
        super(config);
        this.#times = config["times"] || 1;
    }

    static #suffixCalculation(i) {
        let j = i % 10, k = i % 100;
        if (j === 1 && k !== 11) return i + "st";
        if (j === 2 && k !== 12) return i + "nd";
        if (j === 3 && k !== 13) return i + "rd";
        return i + "th";
    }

    setTimes(_times) {
        this.#times = _times;
    }

    getResponse(previous) {
        let results = [];
        let defaults = this.getDefault();

        for (let i = 0; i < this.#times; i++) {
            results.push(prompt(this.getPrompt().replaceAll("%n", MultiFieldEdit.#suffixCalculation(i + 1)), previous[i] || defaults[i] || ""))
        }

        return results;
    }
}

class MutableMultiEditField extends MultiFieldEdit {
    #max;
    #min;
    #defaultTimes = "1";

    constructor(config) {
        super(config);
        this.#max = config["max"] || null;
        this.#min = (config["min"] != null && config["min"] >= 1) ? config["min"] : 0;
    }

    getTimes() {

        let response = prompt(`How many inputs would you like to enter? (Max: ${this.#max} | Min: ${this.#min})`, this.#defaultTimes);

        if (!isNumeric(response)) return this.#min;
        else if (response > this.#max) return this.#max;
        else if (response < this.#min) return this.#min;
        else return response;

    }

    getResponse(_previous) {
        this.setTimes(this.getTimes())
        // noinspection JSValidateTypes
        return super.getResponse(_previous);
    }

}