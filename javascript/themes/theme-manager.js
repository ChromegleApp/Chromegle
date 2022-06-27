class ThemeManager {

    #currentResourcePath = undefined;
    #stylesheet = undefined;

    getCurrentResourcePath = () => this.#currentResourcePath;
    setCurrentResourcePath = (newPath) => this.#currentResourcePath = newPath;

    constructor(resourcePath) {
        this.setCurrentResourcePath(resourcePath);
        let pageLinks = document.getElementsByTagName("link");

        for (let link of pageLinks) {
            if (link.href.includes("https://www.omegle.com/static/style.css")) {
                this.#stylesheet = link;
            }

        }

    }

    loadCurrentTheme(initialize = true) {

        try {
            if (initialize) {
                this.OverrideManager.initialize();
            }

            this.#stylesheet.href = chrome.runtime.getURL(this.#currentResourcePath)
            this.#stylesheet.id = "customStylesheet";
        } catch (ex) {
            Logger.ERROR("The theme manager has failed, stack-trace below:");
            console.log(ex);
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

    OverrideManager = new class {

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
                this.#overrideHeader,
                this.#overrideStudentChatEmoji
            ].forEach((fn) => {
                try {
                    fn();
                } catch (ex) {
                    Logger.ERROR("A theme management function has failed, stack-trace below:");
                    console.log(ex);
                }
            })
        }

        #overrideStudentChatEmoji = () => {
            $("span:contains('▶')").remove()
        }

        #overrideHeader = () => {
            let headerQuery = {}
            headerQuery[config.headerButtonsToggle.getName()] = config.headerButtonsToggle.getDefault();
            chrome.storage.sync.get(headerQuery, (result) => {
                let showHeaderButtons = result[config.headerButtonsToggle.getName()] === "true";
                if (showHeaderButtons) return;

                themeManager.toggleHeaderButton(showHeaderButtons);

            });
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
            $("canvas").replaceWith(ButtonManager.homeButton)
        };


        #overrideTaglineInsertMenu = () => {
            let div = document.createElement("div");
            div.id = "menucontainer"
            div.classList.add("settingsButtonContainer");
            div.append(ButtonManager.menuButton.get(0))
            $("#tagline").replaceWith(div)
        };

        #overrideHongKongPoster = () => {
            let newBanner = document.createElement("img");
            newBanner.src = getResourceURL("images/DiscordBanner.png");
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

}
