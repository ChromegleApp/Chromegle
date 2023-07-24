class VideoPopoutManager extends Module {

    static mobileSupported = false;

    #buttonElementId = "videoPopoutButton";
    #otherVideoId = "othervideo";
    #popoutButton;
    #popout;

    #buttonEnabled;

    async onWrappedVideos() {

        // Create Button
        let button = ButtonFactory.popoutButton(this.#buttonElementId)
            .on("click", this.onPopoutButtonClicked.bind(this)).get(0);

        // Add Button
        document.getElementById(VideoWrapperManager.otherVideoWrapperId).append(button);
        this.#popoutButton = button;

        // Set Status
        let value = await config.popoutToolButtonToggle.retrieveValue();
        this.#buttonEnabled = value === "true";

        this.addEventListener("beforeunload", this.onBeforeUnload, undefined, window);
        this.addEventListener("fullscreenchange", this.onFullscreenChange);

    }

    setButtonVisible(enabled) {
        $(this.#popoutButton).css("display", enabled ? "" : "none");
    }

    onChatStarted() {
        this.#popout?.showSpinner();
    }

    shouldShowButton() {
        return (
            this.#buttonEnabled &&
            !this.#popout &&
            !FullScreenVideoManager.inFullscreen() &&
            ChatRegistry.isChatting() &&
            ChatRegistry.isVideoChatLoaded()
        )
    }

    onVideoLoaded() {

        if (this.shouldShowButton()) {
            this.setButtonVisible(true);
        }

        if (this.#popout) {
            this.#popout.chatStartUpdate(document.getElementById(this.#otherVideoId))
            this.#popout?.hideSpinner();
        }

    }

    onChatEnded() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        if (this.#popout) {
            this.#popout.clearVideo();
            this.#popout.hideSpinner();
        }

        this.setButtonVisible(false);

    }

    onSettingsUpdate(event) {
        let toolEnabled = config.popoutToolButtonToggle.fromSettingsUpdateEvent(event);

        if (toolEnabled == null) {
            return;
        }

        this.#buttonEnabled = toolEnabled === "true";

        if (this.#buttonEnabled) {
            if (this.shouldShowButton()) {
                this.setButtonVisible(true);
            }
        } else {
            this.setButtonVisible(false);
        }

    }

    async onPopoutButtonClicked() {

        this.#popout = new VideoPopout(
            document.getElementById(this.#otherVideoId)
        )

        // Hide while 'popped' out
        this.setButtonVisible(false);

        // Register listener
        this.addEventListener("beforeunload", this.onBeforePopoutUnload, undefined, this.#popout.getWindow());

    }

    onBeforeUnload() {
        this.#popout.close();
    }

    onBeforePopoutUnload() {
        this.#popout = undefined;

        if (this.shouldShowButton()) {
            this.setButtonVisible(true);
        }

    }

    onFullscreenChange(event) {

        if (event.target.id !== VideoWrapperManager.otherVideoWrapperId) {
            return;
        }

        if (this.shouldShowButton()) {
            this.setButtonVisible(true);
        } else {
            this.setButtonVisible(false);
        }

    }

}


class VideoPopout {

    #videoElement;
    #updateInterval;
    #cancelledInterval;
    #window;

    #windowWidth;
    #windowHeight;

    #canvasWidth;
    #canvasHeight;

    #canvas;
    #context;

    constructor(videoElement) {
        this.#videoElement = videoElement;
        this.#cancelledInterval = false;
        this.createPopout();
    }

    getWindow() {
        return this.#window;
    }

    chatStartUpdate(videoElement) {
        this.#videoElement = videoElement;
        this.updateCanvasDimensions();
    }

    clearVideo() {
        this.#context.clearRect(0, 0, this.#canvasWidth, this.#canvasHeight);
    }

    #generatePopoutDocument() {
        return window.open("about:blank", "_blank", `
            width=${this.#windowWidth},
            height=${this.#windowHeight},
            left=${(screen.width / 2) - (this.#windowWidth / 2)},
            top=${(screen.height / 2) - (this.#windowHeight / 2)},
            scrollbars=no,
            menubar=no,
            titlebar=no,
            toolbar=no
        `);
    }

    showSpinner() {
        let spinner = this.#window.document.getElementById("videospinner");
        spinner.style.opacity = "1";
    }

    hideSpinner() {
        let spinner = this.#window.document.getElementById("videospinner");
        spinner.style.opacity = "0";
    }

    createPopout() {

        this.#windowWidth = $(this.#videoElement).width();
        this.#windowHeight = $(this.#videoElement).height();

        // Create Window
        this.#window = this.#generatePopoutDocument();

        // Add elements
        this.#window.document.write(`<title>Chromegle - Omegle Popout</title>`);
        this.#window.document.write(`<style>${ConstantValues.videoPopoutStylesheet}</style>`);
        this.#window.document.write('<canvas id="videoPopout"></canvas>');
        this.#window.document.write('<div id="videospinner"></div>');

        // Add listeners
        this.#window.addEventListener('resize', this.onResize.bind(this));
        this.#window.addEventListener("beforeunload", this.onBeforeUnload.bind(this));

        // Stop loading
        this.#window.stop();

        // Start updates
        this.#startUpdateLoop();

    }

    #startUpdateLoop() {

        this.#canvas = this.#window.document.getElementById("videoPopout");
        this.#context = this.#canvas.getContext('2d');
        this.updateCanvasDimensions();

        this.#updateInterval = setInterval(() => {

            // If paused, pause
            if (this.#videoElement.ended || this.#videoElement.paused) {
                return;
            }

            // Draw the image
            this.#context.drawImage(this.#videoElement, 0, 0, this.#canvasWidth, this.#canvasHeight);

        }, 5);

    }

    getCanvasDimensions() {
        let videoWidth = this.#videoElement.videoWidth;
        let videoHeight = this.#videoElement.videoHeight;
        let heightRatio = videoWidth / videoHeight;
        let newWidth = this.#windowHeight * heightRatio;
        return [newWidth, this.#windowHeight];
    }

    onResize(event) {
        this.#windowWidth = event.target.innerWidth;
        this.#windowHeight = event.target.innerHeight;
        this.updateCanvasDimensions();
    }

    updateCanvasDimensions() {
        [this.#canvasWidth, this.#canvasHeight] = this.getCanvasDimensions();
        this.#canvas.width = this.#canvasWidth;
        this.#canvas.height = this.#canvasHeight;
    }

    close() {
        this.#window.close();
    }

    onBeforeUnload() {
        this.#cancelledInterval = true;
    }

}


