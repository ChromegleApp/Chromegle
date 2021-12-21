
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
    #settingsModal = undefined;

    constructor() {
        this.#settingsModal = document.createElement("div");
        $(this.#settingsModal).load(getResourceURL("html/modal.html"));
        $("html").append(this.#settingsModal)
        this.manageCollapsables();
        this.manageToggleButtons();
        this.manageSwitchButtons();
    }

    manageToggleButtons = () => {
        document.addEventListener("ToggleModify", (response) => {
            const element = document.getElementById(response.detail["element"]);
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
        this.#settingsModal.addEventListener("click", (target) => {
            let element = target.path[0];

            if (element.classList.contains("editFieldButton")) {
                config[element.id].update();
            }

            // Toggle collapsables
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
        MicroModal.show("modal-1")
    }

}