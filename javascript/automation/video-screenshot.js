class VideoScreenshot {
    static instances = [];

    #screenshotButton;
    #buttonElementId;
    #videoElementId;
    #disableAfterChat;
    #extraButtonClasses = []

    getDisableAfterChat() {
        return this.#disableAfterChat;
    }

    getScreenshotButton() {
        return this.#screenshotButton;
    }

    #generateButton() {
        return $(
            `<img src="data:image/png;base64,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"
                       id="${this.#buttonElementId}" 
                       style="display: none;" 
                       class="videoScreenshotButton ${this.#extraButtonClasses.join(' ')} noselect"
                       alt="Screenshot">`
        ).on("click", () => this.screenshotVideo());
    }

    constructor(buttonElementId, videoElementId, disableAfterChat, extraButtonClasses) {
        this.#buttonElementId = buttonElementId;
        this.#videoElementId = videoElementId;
        this.#disableAfterChat = disableAfterChat;
        this.#extraButtonClasses = extraButtonClasses || [];
        this.#screenshotButton = this.#generateButton();
    }

    videoButtonEnabled(enabled) {
        $(this.#screenshotButton).css("display", enabled ? "" : "none");
    }

    videoButtonHidden(enabled) {
        $(this.#screenshotButton).css("visibility", enabled ? "hidden" : "visible");
    }

    static #sanitizePixelString(pixels) {
        return +(pixels.replaceAll("px", ""))
    }

    updateButtonPosition() {
        const videoElement = $(`#${this.#videoElementId}`).get(0);
        let newHeightWidth = $(videoElement).width() * 0.08;

        $(this.#screenshotButton)
            .css("width", `${newHeightWidth}px`)
            .css("height", `${newHeightWidth}px`)

        let topOffset = (
            VideoScreenshot.#sanitizePixelString(videoElement.style.top)
            + VideoScreenshot.#sanitizePixelString(videoElement.style.height)
            - this.#screenshotButton.height()
            - 10
        );


        let leftOffset = (
            VideoScreenshot.#sanitizePixelString(videoElement.style.left)
            + VideoScreenshot.#sanitizePixelString(videoElement.style.width)
            - this.#screenshotButton.width()
            - 10
        )

        $(this.#screenshotButton)
            .css("margin-top", `${topOffset}px`)
            .css("margin-left", `${leftOffset}px`)
    }

    screenshotVideo() {
        const video = $(`#${this.#videoElementId}`).get(0);
        const download = document.createElement("a");
        let canvas = document.createElement("canvas");

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight;

        if (canvas.width <= 0 || canvas.height <= 0) {
            return;
        }

        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

        download.href = canvas.toDataURL();
        download.download = ChatRegistry.getUUID() + ".png";

        download.click();
        Logger.INFO("Screenshotted video of <%s> with chat UUID <%s>", this.#videoElementId, ChatRegistry.getUUID());
    }
}

// On resize, resize block
$(window).on("resize", () => {

    VideoScreenshot.instances.forEach((instance) => {
        setTimeout(() => instance.updateButtonPosition(), 5);
    });

})


document.addEventListener("pageStarted", () => {
    let videoWrapper = $("#videowrapper").get(0);
    if (videoWrapper == null) return;

    VideoScreenshot.instances.push(
        new VideoScreenshot(
            "otherVideoScreenshot",
            "othervideo",
            true
        )
    );

    VideoScreenshot.instances.forEach((instance) => {
        videoWrapper.appendChild(instance.getScreenshotButton().get(0));
        instance.updateButtonPosition();
    });

    document.addEventListener("chatEnded", () => {
        VideoScreenshot.instances.forEach((instance) => {
            if (instance.getDisableAfterChat()) {
                instance.videoButtonEnabled(false)
            }
        });
    });

    window.addEventListener("videoChatLoaded", () => {
        VideoScreenshot.instances.forEach((instance) => {
            instance.videoButtonEnabled(true);
        });
    })

    let hiddenQuery = {}
    hiddenQuery[config.screenshotButtonToggle.getName()] = config.screenshotButtonToggle.getDefault();

    chrome.storage.sync.get(hiddenQuery, (result) => {
        VideoScreenshot.instances.forEach((instance) => {
            instance.videoButtonHidden(!(result[config.screenshotButtonToggle.getName()] === "true"));
        });
    })


});

document.addEventListener("storageSettingsUpdate", (detail) => {
    const result = detail["detail"][config.screenshotButtonToggle.getName()];

    if (result != null) {
        VideoScreenshot.instances.forEach((instance) => {
            instance.videoButtonHidden(!(result === "true"));
        });
    }

});


