class VideoScreenshotManager extends Module {

    static mobileSupported = false;

    #button;
    #buttonId = "videoScreenshotButton";
    #videoElementId = "othervideo";
    #showButton;

    constructor(props) {
        super(props);
    }

    async onWrappedVideos() {

        // Create button
        let button = ButtonFactory.screenshotButton(this.#buttonId)
            .on("click", this.onScreenshotButtonClick.bind(this))
            .get(0);

        // Add button
        document.getElementById(VideoWrapperManager.otherVideoWrapperId).appendChild(button);
        this.#button = button;

        // Should it be shown
        this.#showButton = await config.screenshotToolButtonToggle.retrieveValue() === "true";
    }

    static snapshotVideo(videoElement) {
        let canvas = document.createElement("canvas");

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        if (!canvas.width || !canvas.height) {
            return null;
        }

        canvas.getContext("2d").drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        return canvas;
    }

    onSettingsUpdate(event) {
        let toolsEnabled = config.screenshotToolButtonToggle.fromSettingsUpdateEvent(event);

        if (toolsEnabled === "true") {
            this.#showButton = true;
            if (ChatRegistry.isChatting()) {
                this.onVideoLoaded();
            }
        }

        if (toolsEnabled === "false") {
            this.onChatEnded();
        }
    }

    onScreenshotButtonClick() {
        let canvas = VideoScreenshotManager.snapshotVideo(document.getElementById(this.#videoElementId));

        if (canvas == null) {
            return;
        }

        // Download the element
        const download = document.createElement("a");
        download.href = canvas.toDataURL();
        download.download = `Chromegle-${ChatRegistry.getUUID()}.png`;
        download.click();
        download.remove();

        Logger.INFO(
            "Screenshotted video of <%s> with chat UUID <%s>", this.#videoElementId, ChatRegistry.getUUID()
        );

    }

    onVideoLoaded() {

        if (this.#showButton) {
            this.#button.style.visibility = "visible";
        }

    }

    onChatEnded() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        this.#button.style.visibility = "hidden";

    }

}
