
class PasteMenu extends Module {

    static mobileSupported = false;

    STORAGE_ID = "PASTE_BUTTON_CONFIG";
    STORAGE_DEFAULT = {};
    EDIT_CONTENT_ELEMENT_ID = "editPasteContentButton";
    DEFAULT_PASTE_VALUE = "Hello there!";

    pasteMenuConfig = {};
    menuEnabled = false;
    waitingForButtonSelection = false;
    mutationObserver = new MutationObserver(this.onMutationObserved.bind(this));

    KEYMAP = {
        "1": "PB1",
        "2": "PB2",
        "3": "PB3",
        "4": "PB4",
        "5": "PB5",
    }

    async onPageStarted() {

        this.pasteMenuConfig = await this.retrieveChromeValue(this.STORAGE_ID, this.STORAGE_DEFAULT, "local");
        this.menuEnabled = (await config.pasteMenuToggle.retrieveValue()) === "true";
        this.addEventListener("resize", this.onResize, undefined, window);
        this.addEventListener("keydown", this.onKeyUp);
        this.setupPasteMenu();
    }

    onKeyUp(event) {

        if (!this.menuEnabled) {
            return;
        }

        if(!(this.KEYMAP[event.key] && event.altKey)) {
            return;
        }

        // Paste
        let button = document.getElementById(this.KEYMAP[event.key]);
        button.click();

    }

    setupPasteMenu() {

        $("body").get(0).appendChild(
            $(document.createElement("div"))
                .load(getResourceURL("public/html/paste.html"), null, () => this.registerButtons())
                .get(0)
        );

        this.mutationObserver.observe(document.body, {subtree: true, childList: true});
    }

    onMutationObserved(mutation) {

        for (let mutationRecord of mutation) {
            let potentialMatch = mutationRecord.addedNodes.item(0);

            // Comparing differently makes it not show up, so don't change this log for the love of god
            if (potentialMatch?.classList?.[0] === "chatbox3") {
                this.modifyLogBox();
            }

        }

    }

    onResize() {
        $("#pasteButtonMenu").css("height", $(".logwrapper").height());
    }

    onSettingsUpdate(event) {

        let menuEnabled = config.pasteMenuToggle.fromSettingsUpdateEvent(event);

        if (menuEnabled != null) {
            let action = menuEnabled === "true" ? this.showMenu : this.hideMenu;
            action.bind(this)();
        }
    }

    onPasteButtonClick(buttonId) {

        const pasteConfig = this.pasteMenuConfig || this.STORAGE_DEFAULT;

        if (this.waitingForButtonSelection) {
            this.onPasteButtonEdit(buttonId, pasteConfig);
            return;
        }

        if (ChatRegistry.isChatting()) {
            let chatMsg = $(".chatmsg");
            $(chatMsg).val(chatMsg.val() + (pasteConfig[buttonId] || this.DEFAULT_PASTE_VALUE));
        }

    }

    onEditContentButtonClick() {
        alert(
            this.waitingForButtonSelection
                ? "You are already selecting a button to edit!"
                : "Click the button you want to edit!"
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

    modifyLogBox() {

        if (!this.menuEnabled) {
            return;
        }

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

        this.menuEnabled ? this.modifyLogBox() : this.hideMenu();

        $("#pasteButtonMenu").css("height", $(".logwrapper").height());
        this.addElementListener(".pasteButton", "click", this.onButtonClick);

        let pasteButtons = document.getElementsByClassName("pasteButton");

        for (let button of pasteButtons) {
            if (button.id !== this.EDIT_CONTENT_ELEMENT_ID) {
                button.title = this.pasteMenuConfig[button.id] || this.DEFAULT_PASTE_VALUE;
            }
        }

    }

    onPasteButtonEdit(buttonId, config) {

        // Get the new value
        let newValue = (
            prompt("What do you want the new input to be?", config[buttonId] || "")
        )

        // If they cancelled
        if (newValue === undefined) {
            return;
        }

        // Set new value
        newValue = (newValue || "").substring(0, 1000);
        config[buttonId] = newValue;
        $(`#${buttonId}`).get(0).title = newValue;

        // Update config internally
        this.pasteMenuConfig = (config || this.STORAGE_DEFAULT);
        this.waitingForButtonSelection = false;
        chrome.storage.local.set({[this.STORAGE_ID]: this.pasteMenuConfig}).then();

    }


}



