let themeManager = null;
let settingsManager = null;
let chatRegistry = null;

MicroModal.init();

$(document).on("ready", () => {

    /**
     * Banned Pages
     */
    {
        // Porn-redirect screen
        // noinspection HttpUrlsUsage
        if (window.location.href.includes("banredir.html") || window.location.href.startsWith("http://")) {
            window.location.href = "https://omegle.com/static/ban.html";
            return;
        }

        // Static HTML ban screen
        if (window.location.href.includes("ban.html")) {
            $("html")
                .load(chrome.runtime.getURL("/html/banned.html"))
                .css("visibility", "visible")
                .css("background-color", "#17191a");
            return;
        }
    }


    /**
     * General Start-Up
     */
    {
        document.dispatchEvent(new CustomEvent("startUpEvent"));
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

