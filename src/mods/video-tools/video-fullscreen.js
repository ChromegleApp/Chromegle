class FullScreenVideoManager extends Module {

    static mobileSupported = false;

    #buttonElementId = "videoFullscreenButton";
    #fullscreenButton;
    #showButton;
    #skipTool;
    static inFullscreen = () => document.fullscreenElement != null;

    async onWrappedVideos() {

        // Create Button
        let button = ButtonFactory.fullscreenButton(this.#buttonElementId)
            .on("click", this.onFullscreenButtonClicked.bind(this)).get(0);

        // Add Button
        document.getElementById(VideoWrapperManager.otherVideoWrapperId).append(button);
        this.#fullscreenButton = button;

        // Set Status
        let value = await config.fullscreenToolButtonToggle.retrieveValue();
        this.#showButton = value === "true";

        // Add Listeners
        this.addEventListener("fullscreenchange", this.onFullscreenChange);

        // Add skip tool
        this.#skipTool = new FullscreenSkip();

        // Move spinner for compatibility
        this.moveSpinner();

    }

    onFullscreenChange(event) {

        // Wait for element to become fullscreen
        if (event.target.id !== VideoWrapperManager.otherVideoWrapperId) {
            return;
        }

        // More specific
        FullScreenVideoManager.inFullscreen() ? this.onFullscreenEnter() : this.onFullscreenExit();

    }

    onFullscreenEnter() {
        $("#othervideo").addClass("fullscreen");
        this.#skipTool.show();
        this.#fullscreenButton.style.transform = "rotate(180deg)";
    }

    onFullscreenExit() {
        $("#othervideo").removeClass("fullscreen");
        this.#skipTool.hide();
        this.#fullscreenButton.style.transform = "rotate(0deg)";

        if (!ChatRegistry.isChatting()) {
            this.setButtonVisible(false);
        }

    }

    setButtonVisible(enabled) {
        $(this.#fullscreenButton).css("display", enabled ? "" : "none");
    }

    onChatStarted() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        this.#skipTool?.updateSrc();

    }

    onVideoLoaded() {

        if (this.#showButton) {
            this.setButtonVisible(true);
        }

    }

    onChatEnded() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        this.#skipTool.updateSrc();

        if (!FullScreenVideoManager.inFullscreen()) {
            this.setButtonVisible(false);
        }
    }

    onSettingsUpdate(event) {
        let toolsEnabled = config.fullscreenToolButtonToggle.fromSettingsUpdateEvent(event);

        if (toolsEnabled == null) {
            return;
        }

        this.#showButton = toolsEnabled === "true";
    }

    async onFullscreenButtonClicked() {

        if (FullScreenVideoManager.inFullscreen()) {
            document.exitFullscreen().then();
        } else {
            await this.#tryFullscreen(document.getElementById(VideoWrapperManager.otherVideoWrapperId));
        }

    }

    async #tryFullscreen(div) {

        if (div.requestFullscreen) {
            await div.requestFullscreen();
            return;
        }

        if (div["webkitRequestFullscreen"]) {
            await div["webkitRequestFullscreen"]();
            return;
        }

        if (div["msRequestFullScreen"]) {
            await div["msRequestFullScreen"]();
            return;
        }

        Logger.ERROR("Failed to fullscreen, not supported on this browser.");
        sendErrorLogboxMessage("ERROR: Failed to fullscreen, not supported on this browser.");
    }


    moveSpinner() {

        let spinnerWrapper = document.createElement("div")
        spinnerWrapper.id = "spinnerWrapper";

        let spinner = document.getElementById("othervideospinner");
        spinner.remove();
        spinnerWrapper.appendChild(spinner);

        let otherWrapper = document.getElementById(VideoWrapperManager.otherVideoWrapperId);
        otherWrapper.appendChild(spinnerWrapper);

    }

}

class FullscreenSkip {

    #elementId = "fullscreenSkipButton";
    #element;

    constructor() {
        let button = this.createButton().on('click', this.onButtonClick.bind(this)).get(0);
        document.getElementById(VideoWrapperManager.otherVideoWrapperId).appendChild(button);
        this.#element = button;
        this.hide();
    }

    createButton() {
        return $(`
            <img id="${this.#elementId}" src="${this.getSrc()}" alt="Control Chat" />
            
        `)
    }

    onButtonClick() {

        if (ChatRegistry.isChatting()) {
            skipIfPossible();
            return;
        }

        startIfPossible();
    }

    show() {
        this.#element.style.display = ""
    }

    hide() {
        this.#element.style.display = "none"
    }

    getSrc() {
        return ChatRegistry.isChatting() ? ButtonFactory.endChatSrc : ButtonFactory.startChatSrc;
    }

    updateSrc() {
        this.#element.src = this.getSrc();
    }
}
