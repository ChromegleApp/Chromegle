

class VideoBlocker {
    static instances = [];

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

    blockVideo() {

        // Don't run when chatting
        if (!ChatRegistry.isChatting() && this.#disableAfterChat) {
            return;
        }

        this.#currentlyBlocking = true;
        const videoElement = $(`#${this.#videoElementId}`)
            .css("display", "none")
            .get(0);

        $(this.#coverButton)
            .css("display", "flex")
            .css("width", videoElement.style.width)
            .css("height", videoElement.style.height)
            .css("margin-top", videoElement.style.top);

        if (this.#spinnerElementId != null) {
            $(`#${this.#spinnerElementId}`).css("display", "none");
        }

    }

}



// On resize, resize block
$(window).on("resize", () => {

    VideoBlocker.instances.forEach((blocker) => {
        setTimeout(() => {
            if (blocker.getCurrentlyBlocking()) {
                blocker.blockVideo();
            }
        }, 5);
    });

})


document.addEventListener("pageStarted", (event) => {
    if (!event["detail"]["isVideoChat"]) return;

    VideoBlocker.instances.push(
        new VideoBlocker(
            "otherVideoBlocker",
            "othervideo",
            "othervideospinner",
            true,
            ["otherVideoCover"]
        ),
        new VideoBlocker(
            "selfVideoBlocker",
            "selfvideo",
            null,
            false,
            ["selfVideoCover"]
        )
    );

    VideoBlocker.instances.forEach((blocker) => $("#videowrapper").get(0).appendChild(blocker.getCoverButton().get(0)));

    document.addEventListener("chatEnded", () => {
        VideoBlocker.instances.forEach((blocker) => {
            if (blocker.getDisableAfterChat()) {
                blocker.videoPointerEnabled(false)
                blocker.unblockVideo();
            }
        });
    });

    document.addEventListener("chatStarted", () => {
        VideoBlocker.instances.forEach((blocker) => {
            blocker.videoPointerEnabled(true);
        });
    })


});


