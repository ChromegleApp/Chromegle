class PasteMenu {

    static #pasteMenuConfig = {}
    static menuEnabled;

    static #EDIT_CONTENT_ELEMENT_ID = "editPasteContentButton";
    static #LOCAL_STORAGE_ID = "PASTE_BUTTON_CONFIG";
    static #DEFAULT_STORAGE_VALUE = {}
    static #DEFAULT_PASTE_VALUE = "Hello there!";

    static waitingForButtonSelection = false;

    constructor(pasteMenuConfig, menuEnabled) {
        PasteMenu.menuEnabled = menuEnabled;
        PasteMenu.#pasteMenuConfig = pasteMenuConfig || PasteMenu.#DEFAULT_STORAGE_VALUE;

        $("body")
            .get(0)
            .appendChild(
                $(document.createElement("div"))
                    .load(getResourceURL("html/paste.html"), null, () => this.#registerButtons())
                    .get(0)
            )

        document.addEventListener("chatStarted", () => {
            if (PasteMenu.menuEnabled) PasteMenu.modifyLogBox()
        })

        document.addEventListener("chatButtonClicked", () => {
            if (PasteMenu.menuEnabled) PasteMenu.modifyLogBox();
        });

        if (PasteMenu.menuEnabled) PasteMenu.modifyLogBox();

    }

    static getPasteMenuConfig() {
        return PasteMenu.#pasteMenuConfig || PasteMenu.#DEFAULT_STORAGE_VALUE;
    }

    static setPasteMenuConfig(newConfig) {
        PasteMenu.#pasteMenuConfig = (newConfig || PasteMenu.#DEFAULT_STORAGE_VALUE)
    }

    static getLocalStorageId() {
        return PasteMenu.#LOCAL_STORAGE_ID;
    }

    static getEditContentElementId() {
        return PasteMenu.#EDIT_CONTENT_ELEMENT_ID;
    }

    static getStoredChromeConfig(callback) {
        let pasteMenuQuery = {}
        pasteMenuQuery[PasteMenu.#LOCAL_STORAGE_ID] = PasteMenu.#DEFAULT_STORAGE_VALUE;
        chrome.storage.local.get(pasteMenuQuery, callback);
    }

    static setStoredChromeConfig(newConfig) {
        if (newConfig == null) return;

        let pasteMenuQuery = {}
        pasteMenuQuery[PasteMenu.#LOCAL_STORAGE_ID] = (newConfig || PasteMenu.#DEFAULT_STORAGE_VALUE);

        chrome.storage.local.set(pasteMenuQuery);
        PasteMenu.setPasteMenuConfig(newConfig);

    }

    static modifyLogBox() {
        $(".logbox").css("right", "0.5em")

        $(".logwrapper")
            .css('margin-right', "7.5em")
            .css("border-top-right-radius", "0")
            .css("-webkit-border-top-right-radius", "0");

    }

    static pasteButton(buttonId) {
        const pasteConfig = PasteMenu.getPasteMenuConfig();

        if (PasteMenu.waitingForButtonSelection) {
            PasteMenu._editPasteButton(buttonId, pasteConfig)
        } else {
            if (ChatRegistry.isChatting()) {
                const chatMsg = $(".chatmsg");
                $(chatMsg).val(chatMsg.val() + (pasteConfig[buttonId] || PasteMenu.#DEFAULT_PASTE_VALUE));
            }
        }

    }

    static _editPasteButton(buttonId, config) {
        const _newValue = prompt("What do you want the new input to be?", config[buttonId] || "");
        const newValue = (_newValue || "").substr(0, Math.min(_newValue.length, 1000));

        config[buttonId] = newValue;
        $(`#${buttonId}`).get(0).title = newValue;

        PasteMenu.setStoredChromeConfig(config);
        PasteMenu.waitingForButtonSelection = false;
    }

    static editPasteButton() {
        if (!PasteMenu.waitingForButtonSelection) {
            PasteMenu.waitingForButtonSelection = true;
            alert("Click the button you want to edit!")
        } else {
            alert("You are already selecting a button to edit!")
        }

    }

    #registerButtons() {
        $("#pasteButtonMenu").css("height", $(".logwrapper").height());

        $(".pasteButton")
            .on("click", (event) => {
                const pasteButtonId = $(event.target).closest("a").get(0).id;

                if (pasteButtonId === PasteMenu.getEditContentElementId()) {
                    PasteMenu.editPasteButton();
                } else {
                    PasteMenu.pasteButton(pasteButtonId);
                }

            });

        let pasteButtons = document.getElementsByClassName("pasteButton")
        for (let button of pasteButtons) {
            if (button.id !== PasteMenu.getEditContentElementId()) {
                button.title = PasteMenu.#pasteMenuConfig[button.id] || PasteMenu.#DEFAULT_PASTE_VALUE;
            }
        }

    }

    hideMenu() {
        $(".logwrapper")
            .css("margin-right", "0")
            .css("border-top-right-radius", "0.5em")
            .css("-webkit-border-top-right-radius", "0.5em");

        $("#pasteButtonMenu").css("display", "none");
        PasteMenu.menuEnabled = false;
    }

    showMenu() {
        $("#pasteButtonMenu")
            .css("display", "flex");
        PasteMenu.modifyLogBox();
        PasteMenu.menuEnabled = true;
    }

}

let pasteMenu = null;
document.addEventListener("pageStarted", () => {
    PasteMenu.getStoredChromeConfig((result) => {
        let pasteMenuQuery = {}
        pasteMenuQuery[config.pasteMenuToggle.getName()] = config.pasteMenuToggle.getDefault();

        chrome.storage.sync.get(pasteMenuQuery, (_result) => {
            pasteMenu = new PasteMenu(result[PasteMenu.getLocalStorageId()], _result[config.pasteMenuToggle.getName()] === "true");
        })
    }, true);
});

document.addEventListener("storageSettingsUpdate", (detail) => {
    const menuEnabled = detail["detail"][config.pasteMenuToggle.getName()]
    if (menuEnabled != null) {
        let isEnabled = menuEnabled === "true";
        isEnabled ? pasteMenu.showMenu() : pasteMenu.hideMenu();
        PasteMenu.menuIsHidden = isEnabled;

    }

});
