class Collapsable {
    #collapsableWrapper
    #collapsableElement
    #collapsableInfo

    constructor(settingsCollapsable) {
        this.#collapsableWrapper = settingsCollapsable.parentNode;
        this.#collapsableElement = settingsCollapsable;
        this.#collapsableInfo = this.#collapsableElement.nextElementSibling;
    }

    getId = () => this.#collapsableElement.id;
    isEnabled = () => this.#collapsableInfo.style.display === "block";

    enable = () => {
        this.#collapsableInfo.style.display = "block";
        this.#collapsableElement.classList.add("active");
        this.#collapsableElement.style.borderBottomRightRadius = "0";
        this.#collapsableElement.style.borderBottomLeftRadius = "0";
    }
    disable = () => {
        this.#collapsableInfo.style.display = "none";
        this.#collapsableElement.classList.remove("active");
        this.#collapsableElement.style.borderBottomRightRadius = "";
        this.#collapsableElement.style.borderBottomLeftRadius = "";
    }


}


class ToggleButton {
    #element;

    constructor(element) {
        this.#element = element;
    }

    enable() {
        this.#element.innerHTML = "Disable"
        this.#element.classList.add("editToggleEnabled")
    }

    disable() {
        this.#element.innerHTML = "Enable"
        this.#element.classList.remove("editToggleEnabled")

    }
}

class SwitchButton {
    #element;

    constructor(element) {
        this.#element = element;
    }

    enable() {
        this.#element.classList.add("editToggleEnabled")
    }

    disable() {
        this.#element.classList.remove("editToggleEnabled")

    }
}


class SettingsMenu {
    #settingsModalElement = undefined;
    static #modalElementId = "modal-1";

    constructor() {
        this.#settingsModalElement = document.createElement("div");

        $(this.#settingsModalElement).load(getResourceURL("public/html/settings.html"));

        $("html").append(this.#settingsModalElement);
        this.manageCollapsables();
        this.manageToggleButtons();
        this.manageSwitchButtons();

    }


    manageToggleButtons = () => {
        document.addEventListener("ToggleModify", (response) => {
            const element = document.getElementById(response.detail["element"]);

            if (element == null) {
                Logger.ERROR("Missing a settings element for a toggle:", response)
            }

            const toggle = new ToggleButton(element)

            if (response.detail.value === "true") {
                toggle.enable();
            } else if (response.detail.value === "false") {
                toggle.disable();
            }
        })
    }

    manageSwitchButtons = () => {
        document.addEventListener("SwitchModify", (response) => {
            const element = document.getElementById(response["detail"]["element"]);

            for (let elementName of response["detail"]["others"]) {
                let other = $(`#${elementName}`).get(0);
                let otherSwitch = new SwitchButton(other);
                otherSwitch.disable();
            }

            new SwitchButton(element).enable();

        });
    }

    manageCollapsables = () => {
        this.#settingsModalElement.addEventListener("click", (target) => {
            let element = target.composedPath()[0];

            if (element.classList.contains("editFieldButton")) {
                config[element.id].update();
            }

            // Toggle collapsibles
            if (element.classList.contains("settingsCollapsable")) {

                // Update field toggles
                let keys = Object.keys(config);
                for (let key of keys) {
                    let cfg = config[key];
                    if (cfg.getType() === "toggle") config[key].update(true);
                    if (cfg.getType() === "switch") config[key].update(true);
                }

                let collapsables = document.getElementsByClassName("settingsCollapsable");
                for (let _ of collapsables) {
                    let collapsable = new Collapsable(_);

                    // The one we clicked
                    if (element.id === collapsable.getId()) {

                        if (collapsable.isEnabled()) {
                            collapsable.disable();
                        } else {
                            collapsable.enable();
                        }
                    }

                    // Any other one
                    else {
                        collapsable.disable();

                    }

                }
            }


        })
    }

    enable = () => {
        MicroModal.show(SettingsMenu.#modalElementId)
    }

    disable = () => {
        MicroModal.close(SettingsMenu.#modalElementId)
    }

}
