class ThemeManager extends Module {

    #stylesheet;

    OverrideManager = new OverrideManager();

    constructor() {
        super();
        config.semiLightModeOption.retrieveValue().then(this.setupTheme.bind(this));
    }

    async setupTheme(themeMode) {

        // Set up MicroModal
        MicroModal.init();

        // Set the theme mode
        this.#stylesheet = document.querySelector('[href*="/static/style.css"]');

        // Initialize overrides
        this.OverrideManager.initialize();
        this.setThemeMode(config[themeMode].getValue());

        // Header settings
        let headerEnabled = await config.headerButtonsToggle.retrieveValue();
        this.toggleHeaderButton(headerEnabled === "true")

        // Make page visible
        document.getElementsByTagName("html")[0].style.visibility = "visible";

    }

    setThemeMode(resourcePath) {
        this.#stylesheet.href = chrome.runtime.getURL(resourcePath);
        this.#stylesheet.id = "customStylesheet";
    }

    onSettingsUpdate(event) {
        let headerEnabled = config.headerButtonsToggle.fromSettingsUpdateEvent(event);

        if (headerEnabled != null) {
            this.toggleHeaderButton(headerEnabled === "true");
            return;
        }

        let modeChanged = config.semiLightModeOption.fromSettingsUpdateEvent(event);

        if (modeChanged != null) {
            this.setThemeMode(config[modeChanged].getValue());
        }

    }

    toggleHeaderButton = (headerEnabled) => {

        if (headerEnabled) {
            $("#sharebuttons").css("display", "");
            $("#onlinecount").css("margin-top", "");
        } else {
            $("#sharebuttons").css("display", "none");
            $("#onlinecount").css("margin-top", "-15px");
        }

    }

}


class OverrideManager {

    initialize() {
        [
            this.#overrideBody,
            this.#overrideLanguage,
            this.#overrideLogo,
            this.#overrideTaglineInsertMenu,
            this.#overrideHongKongPoster,
            this.#overrideHomePageText,
            this.#overrideTopicEditor,
            this.#overrideCollegeAndUnModeratedButtons,
            this.#overrideLinks,
            this.#overrideStudentChatEmoji,
            this.#resizeCommonInterestsLabel
        ].forEach((fn) => {
            try {
                fn();
            } catch (ex) {
                Logger.ERROR("A theme management function has failed, stack-trace below:");
                console.log(ex);
            }
        })
    }

    #resizeCommonInterestsLabel = () => {
        $(".shoulduselikescheckbox").parent().css("font-size", "15px");

    }

    #overrideStudentChatEmoji = () => {
        $("span:contains('▶')").remove()
    }

    #overrideBody = () => {
        $("body").css("min-height", "").css("top", "")
    }

    #overrideLanguage = () => {
        $(".goog-te-gadget-simple").removeClass("goog-te-gadget-simple").addClass("select-language-button");

    };
    #overrideLinks = () => $("#feedback").remove();
    #overrideLogo = () => {
        $("#logo").attr("id", "omegleLogo");


        $("#omegleLogo > img").replaceWith(ButtonFactory.homeButton)
    };


    #overrideTaglineInsertMenu = () => {
        let div = document.createElement("div");
        div.id = "menucontainer";
        div.classList.add("settingsButtonContainer");
        div.append(ButtonFactory.menuButton.get(0))
        $("#tagline").replaceWith(div);
    };

    #overrideHongKongPoster = () => {
        let newBanner = document.createElement("img");
        newBanner.src = getResourceURL("public/images/DiscordBanner.png");
        newBanner.href = ConstantValues.discordURL;
        newBanner.classList.add("customDiscordBanner");
        $(newBanner).on("click", () => window.open(ConstantValues.discordURL));
        $("img[src$='/static/standwithhk.jpeg']").replaceWith(newBanner);
    }
    #overrideTopicEditor = () => {
        let editor = $(".topictageditor").get(0);
        if (editor != null) editor.style.background = null;
    };

    #overrideHomePageText() {
        $("#mobilesitenote").get(0).innerHTML =
            "Thanks for using Chromegle! Like what we've got? " +
            "<a target='_blank' href='https://www.isaackogan.com'>Check out the developer</a> " +
            "for more :)";
    }

    #overrideCollegeAndUnModeratedButtons() {
        const collegeButton = $("a[href='javascript:']").get(0);

        if (collegeButton != null) {
            collegeButton.id = "collegeButton";
            collegeButton.style.background = null;
            collegeButton.style.border = null;
            collegeButton.style.color = null;
        }


        const videoButtonUnModerated = $("#videobtnunmoderated").get(0);

        if (videoButtonUnModerated != null) {
            videoButtonUnModerated.style.background = null;
            videoButtonUnModerated.style.border = null;
            videoButtonUnModerated.style.padding = null;
            videoButtonUnModerated.style.color = null;
        }

    }

}
