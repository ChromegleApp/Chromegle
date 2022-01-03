const PasteMenu = {

    EDIT_CONTENT_ELEMENT_ID: "editPasteContentButton",
    LOCAL_STORAGE_ID: "PASTE_BUTTON_CONFIG",
    DEFAULT_STORAGE_VALUE: {},
    DEFAULT_PASTE_VALUE: "Hello there!",

    pasteMenuConfig: {},
    menuEnabled: false,
    waitingForButtonSelection: false,

    getPasteMenuConfig: () => PasteMenu.pasteMenuConfig || PasteMenu.DEFAULT_STORAGE_VALUE,
    setPasteMenuConfig: (newConfig) => PasteMenu.pasteMenuConfig = (newConfig || PasteMenu.DEFAULT_STORAGE_VALUE),
    getLocalStorageId: () => PasteMenu.LOCAL_STORAGE_ID,
    getEditContentElementId: () => PasteMenu.EDIT_CONTENT_ELEMENT_ID,

    initialize() {
        document.addEventListener("pageStarted", () => PasteMenu._pageStarted());
        document.addEventListener("storageSettingsUpdate", (detail) => PasteMenu._storageSettingsUpdate(detail));
    },

    _pageStarted() {
        PasteMenu.getStoredChromeConfig((result) => {
            let pasteMenuQuery = {}
            pasteMenuQuery[config.pasteMenuToggle.getName()] = config.pasteMenuToggle.getDefault();

            chrome.storage.sync.get(pasteMenuQuery, (_result) => {
                PasteMenu._initialize(result[PasteMenu.getLocalStorageId()], _result[config.pasteMenuToggle.getName()] === "true");
            })
        }, true);
    },

    _storageSettingsUpdate(detail) {
        const menuEnabled = detail["detail"][config.pasteMenuToggle.getName()]
        if (menuEnabled != null) {
            let isEnabled = menuEnabled === "true";
            isEnabled ? PasteMenu.showMenu() : PasteMenu.hideMenu();
            PasteMenu.menuIsHidden = isEnabled;

        }
    },

    _initialize(pasteMenuConfig, menuEnabled) {
        PasteMenu.menuEnabled = menuEnabled;
        PasteMenu.pasteMenuConfig = pasteMenuConfig || PasteMenu.DEFAULT_STORAGE_VALUE;

        PasteMenu._loadMenu();

        document.addEventListener("chatStarted", () => {if (PasteMenu.menuEnabled) PasteMenu._modifyLogBox()});
        document.addEventListener("chatButtonClicked", () => {if (PasteMenu.menuEnabled) PasteMenu._modifyLogBox();});
        document.addEventListener("keyup", (event) => {
            if (event.key === "Escape" && PasteMenu.menuEnabled) setTimeout(() => PasteMenu._modifyLogBox(), 0);
        })


    },


    getStoredChromeConfig(callback) {
        let pasteMenuQuery = {}
        pasteMenuQuery[PasteMenu.LOCAL_STORAGE_ID] = PasteMenu.DEFAULT_STORAGE_VALUE;
        chrome.storage.local.get(pasteMenuQuery, callback);
    },


    setStoredChromeConfig(newConfig) {
        if (newConfig == null) return;

        let pasteMenuQuery = {}
        pasteMenuQuery[PasteMenu.LOCAL_STORAGE_ID] = (newConfig || PasteMenu.DEFAULT_STORAGE_VALUE);

        chrome.storage.local.set(pasteMenuQuery);
        PasteMenu.setPasteMenuConfig(newConfig);

    },

    onPasteButtonClick(buttonId) {
        const pasteConfig = PasteMenu.getPasteMenuConfig();

        if (PasteMenu.waitingForButtonSelection) {
            PasteMenu._editPasteButton(buttonId, pasteConfig)
        } else {
            if (ChatRegistry.isChatting()) {
                const chatMsg = $(".chatmsg");
                $(chatMsg).val(chatMsg.val() + (pasteConfig[buttonId] || PasteMenu.DEFAULT_PASTE_VALUE));
            }
        }

    },

    onEditContentButtonClick() {
        if (!PasteMenu.waitingForButtonSelection) {
            PasteMenu.waitingForButtonSelection = true;
            alert("Click the button you want to edit!")
        } else {
            alert("You are already selecting a button to edit!")
        }

    },

    hideMenu() {
        $(".logwrapper")
            .css("margin-right", "0")
            .css("border-top-right-radius", "0.5em")
            .css("-webkit-border-top-right-radius", "0.5em");

        $("#pasteButtonMenu").css("display", "none");
        PasteMenu.menuEnabled = false;
    },

    showMenu() {
        $("#pasteButtonMenu")
            .css("display", "flex");
        PasteMenu._modifyLogBox();
        PasteMenu.menuEnabled = true;
    },


    _loadMenu() {
        if (PasteMenu.menuEnabled) PasteMenu._modifyLogBox();
        $("body").get(0).appendChild(
            $(document.createElement("div"))
                .load(getResourceURL("html/paste.html"), null, () => PasteMenu.__registerButtons())
                .get(0)
        )
    },

    _modifyLogBox() {
        $(".logbox").css("right", "0.5em")

        $(".logwrapper")
            .css('margin-right', "7.5em")
            .css("border-top-right-radius", "0")
            .css("-webkit-border-top-right-radius", "0");

    },

    __registerButtons() {

            $("#pasteButtonMenu").css("height", $(".logwrapper").height());


            $(".pasteButton")
                .on("click", (event) => {
                    const pasteButtonId = $(event.target).closest("a").get(0).id;

                    if (pasteButtonId === PasteMenu.getEditContentElementId()) PasteMenu.onEditContentButtonClick();
                    else PasteMenu.onPasteButtonClick(pasteButtonId);

                });

            let pasteButtons = document.getElementsByClassName("pasteButton")


            for (let button of pasteButtons) {
                if (button.id !== PasteMenu.getEditContentElementId()) {
                    button.title = PasteMenu.pasteMenuConfig[button.id] || PasteMenu.DEFAULT_PASTE_VALUE;
                }
            }
    },

    _editPasteButton(buttonId, config) {
        const _newValue = prompt("What do you want the new input to be?", config[buttonId] || "");
        const newValue = (_newValue || "").substr(0, Math.min(_newValue.length, 1000));

        config[buttonId] = newValue;
        $(`#${buttonId}`).get(0).title = newValue;

        PasteMenu.setStoredChromeConfig(config);
        PasteMenu.waitingForButtonSelection = false;
    }


}



