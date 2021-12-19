
class Collapsible {
    #collapsibleWrapper
    #collapsibleElement
    #collapsibleInfo

    constructor(settingsCollapsible) {
        this.#collapsibleWrapper = settingsCollapsible.parentNode;
        this.#collapsibleElement = settingsCollapsible;
        this.#collapsibleInfo = this.#collapsibleElement.nextElementSibling;
    }

    getId = () => this.#collapsibleElement.id;
    isEnabled = () => this.#collapsibleInfo.style.display === "block";

    enable = () => {
        this.#collapsibleInfo.style.display = "block";
        this.#collapsibleElement.classList.add("active");
        this.#collapsibleElement.style.borderBottomRightRadius = "0";
        this.#collapsibleElement.style.borderBottomLeftRadius = "0";
    }
    disable = () => {
        this.#collapsibleInfo.style.display = "none";
        this.#collapsibleElement.classList.remove("active");
        this.#collapsibleElement.style.borderBottomRightRadius = "";
        this.#collapsibleElement.style.borderBottomLeftRadius = "";
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
        this.manageCollapsibles();
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

    manageCollapsibles = () => {
        this.#settingsModal.addEventListener("click", (target) => {
            let element = target.path[0];

            if (element.classList.contains("editFieldButton")) {
                config[element.id].update();
            }

            // Toggle collapsibles
            if (element.classList.contains("settingsCollapsible")) {

                // Update field toggles
                let keys = Object.keys(config);
                for (let key of keys) {
                    let cfg = config[key];
                    if (cfg.getType() === "toggle") config[key].update(true);
                    if (cfg.getType() === "switch") config[key].update(true);
                }

                let collapsibles = document.getElementsByClassName("settingsCollapsible");
                for (let _ of collapsibles) {
                    let collapsible = new Collapsible(_);

                    // The one we clicked
                    if (element.id === collapsible.getId()) {

                        if (collapsible.isEnabled()) {
                            collapsible.disable();
                        } else {
                            collapsible.enable();
                        }
                    }

                    // Any other one
                    else {
                        collapsible.disable();

                    }

                }
            }


        })
    }

    enable = () => {
        MicroModal.show("modal-1")
    }

}