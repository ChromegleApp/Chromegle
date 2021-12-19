let themeManager = null;
let settingsManager = null;
let chatRegistry = null;

MicroModal.init();


$(document).on("ready", () => {

    /**
     * General Start-Up
     */
    {
        settingsManager = new SettingsManager();
        chatRegistry = new ChatRegistry();
        chatRegistry.startObserving();
    }

    /**
     * Load Theme Data
     */
    {

        let themeQuery = {}
        themeQuery[config.semiLightModeOption.getName()] = config.semiLightModeOption.getDefault();

        chrome.storage.sync.get(themeQuery, (result) => {
            themeManager = new ThemeManager(config[result[config.semiLightModeOption.getName()]].getValue());
            themeManager.loadCurrentTheme();
            document.getElementsByTagName("html")[0].style.visibility = "visible";
        });
    }

});

