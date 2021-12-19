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

    loadCurrentTheme() {
        this.OverrideManager.initialize();
        this.#stylesheet.href = chrome.runtime.getURL(this.#currentResourcePath)
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
                this.#overrideHeader
            ].forEach((fn) => {
                try {
                    fn();
                } catch (ex) {
                    console.log(ex);
                }
            })
        }

        #overrideHeader = () => {
            let headerQuery = {}
            headerQuery[config.headerButtonsToggle.getName()] = config.headerButtonsToggle.getDefault();
            chrome.storage.sync.get(headerQuery, (result) => {
                let showHeaderButtons = result[config.headerButtonsToggle.getName()] === "true";
                if (showHeaderButtons) return;

                $("#sharebuttons").remove();
                $("#onlinecount").css("margin-top", "-15px");

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
            $("#tagline").replaceWith(ButtonManager.menuButton)
        };

        #overrideHongKongPoster = () => {
            let newBanner = document.createElement("img");
            newBanner.src = getResourceURL("images/DiscordBanner.png");
            newBanner.href = ConstantValues.discordURL;
            newBanner.classList.add("customDiscordBanner");
            $(newBanner).on("click", () => window.open(ConstantValues.discordURL));
            $("img[src$='/static/standwithhk.jpeg']").replaceWith(newBanner);
        }
        #overrideTopicEditor = () => $(".topictageditor").get(0).style.background = null;

        #overrideHomePageText() {
            $("#mobilesitenote").get(0).innerHTML =
                "Thanks for using Chromegle! Like what we've got? " +
                "<a href='https://www.isaackogan.com'>Check out the developer</a> " +
                "for more :)";
        }

        #overrideCollegeAndUnModeratedButtons() {
            const collegeButton = $("a[href='javascript:']").get(0);
            collegeButton.id = "collegeButton";
            collegeButton.style.background = null;
            collegeButton.style.border = null;
            collegeButton.style.color = null;

            const videoButtonUnModerated = $("#videobtnunmoderated").get(0);
            videoButtonUnModerated.style.background = null;
            videoButtonUnModerated.style.border = null;
            videoButtonUnModerated.style.padding = null;
            videoButtonUnModerated.style.color = null;

        }

}

}