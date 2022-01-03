class VideoBlocker {
    #currentlyBlocking = false;
    #coverButton;
    #buttonElementId;
    #videoElementId;
    #spinnerElementId;
    #disableAfterChat;
    #extraButtonClasses = []

    getDisableAfterChat() {
        return this.#disableAfterChat;
    }

    getCurrentlyBlocking() {
        return this.#currentlyBlocking;
    }

    getCoverButton() {
        return this.#coverButton;
    }

    #generateButton() {
        return $(
            `<div id="${this.#buttonElementId}" 
                       style="position: absolute; display: none; cursor: pointer;" class="videoCoverButton ${this.#extraButtonClasses.join(' ')}">
                  <div class="nsfwCoverTextWrapper"><p style="margin: auto;" class="noselect">Click to Unblock</p></div></div>`
        ).on("click", () => this.unblockVideo());
    }

    constructor(buttonElementId, videoElementId, spinnerElementId, disableAfterChat, extraButtonClasses) {
        this.#buttonElementId = buttonElementId;
        this.#videoElementId = videoElementId;
        this.#spinnerElementId = spinnerElementId;
        this.#disableAfterChat = disableAfterChat;
        this.#extraButtonClasses = extraButtonClasses || [];
        this.#coverButton = this.#generateButton();

        $(`#${videoElementId}`).on("click", () => this.blockVideo());

    }

    unblockVideo() {
        this.#currentlyBlocking = false;
        $(`#${this.#buttonElementId}`).css("display", "none");
        $(`#${this.#videoElementId}`).css("display", "block");
    }

    videoPointerEnabled(enabled) {
        $(`#${this.#videoElementId}`).css("cursor", enabled ? "pointer" : "");
    }

    blockVideo(withText = true) {

        // Don't run when chatting
        if (!ChatRegistry.isChatting() && this.#disableAfterChat) {
            return;
        }

        this.#currentlyBlocking = true;
        const videoElement = $(`#${this.#videoElementId}`)
            .css("display", "none")
            .get(0);

        let buttonDOM = $(this.#coverButton)
            .css("display", "flex")
            .css("width", videoElement.style.width)
            .css("height", videoElement.style.height)
            .css("margin-top", videoElement.style.top)
            .get(0);

        if (withText) $(buttonDOM.childNodes[1]).css("display", "flex");
        else $(buttonDOM.childNodes[1]).css("display", "none");

    }

}

const VideoBlockerManager = {

    instances: [],
    otherVideoBlocker: undefined,

    initialize() {
        document.addEventListener("pageStarted", (event) => VideoBlockerManager._pageStarted(event));
        $(window).on("resize", () => VideoBlockerManager._onWindowResize())
    },

    _onWindowResize() {
        VideoBlockerManager.instances.forEach((blocker) => {
            setTimeout(() => {
                if (blocker.getCurrentlyBlocking()) {
                    blocker.blockVideo();
                }
            }, 5);
        });
    },

    _pageStarted(event) {
        if (!event["detail"]["isVideoChat"]) return;

        VideoBlockerManager.otherVideoBlocker = new VideoBlocker(
            "otherVideoBlocker",
            "othervideo",
            "othervideospinner",
            true,
            ["otherVideoCover"]
        );

        VideoBlockerManager.instances.push(
            VideoBlockerManager.otherVideoBlocker,
            new VideoBlocker(
                "selfVideoBlocker",
                "selfvideo",
                null,
                false,
                ["selfVideoCover"]
            )
        );

        VideoBlockerManager.instances.forEach((blocker) => $("#videowrapper").get(0).appendChild(blocker.getCoverButton().get(0)));

        document.addEventListener("chatEnded", () => VideoBlockerManager.__chatEnded());
        document.addEventListener("chatStarted", () => VideoBlockerManager.__chatStarted())


    },

    __chatEnded() {
        VideoBlockerManager.instances.forEach((blocker) => {
            if (blocker.getDisableAfterChat()) {
                blocker.videoPointerEnabled(false)
                blocker.unblockVideo();
            }
        });
    },

    __chatStarted() {
        VideoBlockerManager.instances.forEach((blocker) => {
            blocker.videoPointerEnabled(true);
        });
    }

}







