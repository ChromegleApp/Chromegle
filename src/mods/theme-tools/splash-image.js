class SplashImageHandler extends Module {

    static mobileSupported = false;

    constructor() {
        super();
        config.homePageSplashToggle.retrieveValue().then(this.setup.bind(this));
    }

    async setup(splashPageEnabled) {

        if (splashPageEnabled === "true") {
            await this.setSplash();
        }
    }

    async setSplash(splashURL = null) {

        if (splashURL == null) {
            splashURL = await config.homePageSplashEdit.retrieveValue();
        }

        if (await this.validImageURL(splashURL)) {
            $("html").css("background-image", `url("${splashURL}")`);
            $("body").css("background-color", 'rgba(255, 255, 255, 0)');
            $("#header").css("background-color", 'rgba(255, 255, 255, 0)');
        }
    }

    removeSplash() {
        $("html").css("background-image", ``);
        $("body").css("background-color", '');
        $("#header").css("background-color", '');
    }

    async validImageURL(url) {
        let response = await fetch(url);
        return response.status === 200;
    }

    async onSettingsUpdate(event) {
        let splashEnabled = config.homePageSplashToggle.fromSettingsUpdateEvent(event);
        let splashEditURL = config.homePageSplashEdit.fromSettingsUpdateEvent(event);

        // Splash Toggled
        if (splashEnabled != null) {
            splashEnabled === "true" ? await this.setSplash() : this.removeSplash();
        }

        // Value Edited
        else if (splashEditURL != null) {
            await this.setSplash(splashEditURL);
        }

    }

}
