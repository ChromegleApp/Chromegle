const SplashImageHandler = {

    initialize() {
        document.addEventListener("localStorageLoaded", () => {
            setTimeout(() => {
                this.setSplashEnabled(config.homePageSplashToggle.getLocalValue() || config.homePageSplashToggle.getDefault());
            }, 25);
        })
    },

    setSplashEnabled(enabled) {

        // Enabling me
        if (enabled === "true") {
            let splashImageURL = config.homePageSplashEdit.getLocalValue() || config.homePageSplashEdit.getDefault();

            checkImage(splashImageURL, () => {
                $("html").css("background-image", `url("${splashImageURL}")`);
                $("body").css("background-color", 'rgba(255, 255, 255, 0)');
                $("#header").css("background-color", 'rgba(255, 255, 255, 0)');

            }, () => {
                Logger.ERROR("Check for valid splash image FAILED, splash will not be enabled")
            });

            return;
        }

        // Disabling me
        $("html").css("background-image", ``);
        $("body").css("background-color", '');
        $("#header").css("background-color", '');

    }

}

document.addEventListener("storageSettingsUpdate", (event) => {
    const keys = Object.keys(event["detail"]);
    setTimeout(() => {

        // Splash toggle
        if (keys.includes(config.homePageSplashToggle.getName())) {
            SplashImageHandler.setSplashEnabled(config.homePageSplashToggle.getLocalValue());
        }

        if (keys.includes(config.homePageSplashEdit.getName())) {

            SplashImageHandler.setSplashEnabled(config.homePageSplashToggle.getLocalValue());

        }

    }, 25);


})


