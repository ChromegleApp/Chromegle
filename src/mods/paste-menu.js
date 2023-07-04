
class PasteMenu extends Module {

    EDIT_CONTENT_ELEMENT_ID = "editPasteContentButton";
    LOCAL_STORAGE_ID = "PASTE_BUTTON_CONFIG";
    DEFAULT_STORAGE_VALUE = {};
    DEFAULT_PASTE_VALUE = "Hello there!";

    pasteMenuConfig = {};
    menuEnabled = false;
    waitingForButtonSelection = false;

    constructor() {
        super();
        this.addEventListener("pageStarted", this.onPageStarted);
        this.addEventListener("storageSettingsUpdate", this.onStorageSettingsUpdate);
    }

    setPasteMenuConfig(newConfig) {
        this.pasteMenuConfig = (newConfig || this.DEFAULT_STORAGE_VALUE);
    };

    onPageStarted() {
        let pasteMenuQuery = {[this.LOCAL_STORAGE_ID]: this.DEFAULT_STORAGE_VALUE};
        chrome.storage.local.get(pasteMenuQuery, (result) => {
            let pasteMenuToggleQuery = {[config.pasteMenuToggle.getName()]: config.pasteMenuToggle.getDefault()};
            chrome.storage.sync.get(pasteMenuToggleQuery, (result) => {
                this.pasteMenuSetup(
                    result[this.LOCAL_STORAGE_ID],
                    result[config.pasteMenuToggle.getName()] === "true"
                );
            })
        });

    }

    pasteMenuSetup(pasteMenuConfig, menuEnabled) {
        this.menuEnabled = menuEnabled;
        this.pasteMenuConfig = pasteMenuConfig || this.DEFAULT_STORAGE_VALUE;
        this.loadPasteMenu();

        this.addEventListener("chatStarted", () => this.menuEnabled ? this.modifyLogBox() : null);
        this.addEventListener("chatButtonClicked", () => this.menuEnabled ? this.modifyLogBox() : null);
        this.addEventListener("resize", this.onResize);
        this.addEventListener("keyup", (event) => {
            if (event.key === "Escape" && this.menuEnabled) {
                setTimeout(() => this.modifyLogBox(), 0);
            }
        })
    }

    onResize() {
        if (!this.menuEnabled) {
            return;
        }

        $("#pasteButtonMenu").css("height", $(".logwrapper").height());

    }

    onStorageSettingsUpdate(event) {
        let menuEnabled = event.detail[config.pasteMenuToggle.getName()];
        if (menuEnabled != null) {
            menuEnabled === "true" ? this.showMenu() : this.hideMenu();
        }
    }

    setStoredChromeConfig(newConfig) {
        if (newConfig == null) return;
        chrome.storage.local.set({[this.LOCAL_STORAGE_ID]: (newConfig || this.DEFAULT_STORAGE_VALUE)}).then();
        this.setPasteMenuConfig(newConfig);
    }

    onPasteButtonClick(buttonId) {
        const pasteConfig = this.pasteMenuConfig || this.DEFAULT_STORAGE_VALUE;

        if (this.waitingForButtonSelection) {
            this.editPasteButton(buttonId, pasteConfig);
            return;
        }

        if (ChatRegistry.isChatting()) {
            let chatMsg = $(".chatmsg");
            $(chatMsg).val(chatMsg.val() + (pasteConfig[buttonId] || this.DEFAULT_PASTE_VALUE));
        }

    }

    onEditContentButtonClick() {
        alert(this.waitingForButtonSelection ?
            "You are already selecting a button to edit!" : "Click the button you want to edit!"
        );

        this.waitingForButtonSelection = true;
    }

    hideMenu() {
        this.menuEnabled = false;

        $("#pasteButtonMenu").css("display", "none");
        $(".logwrapper")
            .css("margin-right", "0")
            .css("border-top-right-radius", "0.5em")
            .css("-webkit-border-top-right-radius", "0.5em");
    }

    showMenu() {
        this.menuEnabled = true;

        $("#pasteButtonMenu").css("display", "flex");
        this.modifyLogBox();
    }

    loadPasteMenu() {
        $("body").get(0).appendChild(
            $(document.createElement("div"))
                .load(getResourceURL("public/html/paste.html"), null, () => this.registerButtons())
                .get(0)
        )

        this.menuEnabled ? this.modifyLogBox() : setTimeout(this.hideMenu, 50);

    }

    modifyLogBox() {
        $(".logbox").css("right", "0.5em")

        $(".logwrapper")
            .css('margin-right', "7.5em")
            .css("border-top-right-radius", "0")
            .css("-webkit-border-top-right-radius", "0");

    }

    onButtonClick(event) {
        let pasteButtonId = $(event.target).closest("a").get(0).id;

        (
            pasteButtonId === this.EDIT_CONTENT_ELEMENT_ID ?
            this.onEditContentButtonClick() : this.onPasteButtonClick(pasteButtonId)
        )

    }

    registerButtons() {

        $("#pasteButtonMenu").css("height", $(".logwrapper").height());
        this.addElementListener(".pasteButton", "click", this.onButtonClick);

        let pasteButtons = document.getElementsByClassName("pasteButton")

        for (let button of pasteButtons) {
            if (button.id !== this.EDIT_CONTENT_ELEMENT_ID) {
                button.title = this.pasteMenuConfig[button.id] || this.DEFAULT_PASTE_VALUE;
            }
        }
    }

    editPasteButton(buttonId, config) {
        const _newValue = prompt("What do you want the new input to be?", config[buttonId] || "");
        const newValue = (_newValue || "").substring(0, Math.min(_newValue.length, 1000));

        config[buttonId] = newValue;
        $(`#${buttonId}`).get(0).title = newValue;

        this.setStoredChromeConfig(config);
        this.waitingForButtonSelection = false;
    }


}



