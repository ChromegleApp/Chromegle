/**
 * No host available for the NSFW api. Until such a date, there will be no filter :(
 */
class VideoFilterManager extends Module {

    /**
     * When adding this back, make sure to add CSS rule
     *
     * #othervideospinner {
     *     display: block !important;
     * }
     */
    constructor() {
        super();
    }

    /**
     * This method (and showSpinner) uses a cute little trick to better control the video spinner.
     * We keep the "display" set to "block" AT ALL TIMES via CSS, but control the *visibility* so that the animation frame
     * continues, even when hidden. This means there is no 'flash' when the chat is loaded as Chromegle hides the video again.
     */
    hideSpinner() {
        document.getElementById("othervideospinner").style.visibility = "hidden";
    }

    showSpinner() {
        document.getElementById("othervideospinner").style.visibility = "";
    }


    onChatStarted() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        this.showSpinner();
    }

    onChatEnded() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        this.stopVideoHide();

    }

    extendVideoHide() {
        document.getElementById("othervideo").style.display = "none"
        document.getElementById("otherVideoBlocker").style.display = "none";
    }

    stopVideoHide() {
        document.getElementById("othervideo").style.display = "block"
        document.getElementById("otherVideoBlocker").style.display = "block";
        this.hideSpinner();
    }

    onVideoLoaded() {

        if (!ChatRegistry.isChatting()) {
            return;
        }

        console.log('EXTENDED');
        this.extendVideoHide();
        this.checkNSFW().then(this.withNSFWChecked.bind(this)).catch(this.withNSFWCheckError.bind(this))

    }

    async checkNSFW() {
        let canvas = VideoScreenshotManager.snapshotVideo(document.getElementById(this.#videoElementId));

        if (canvas == null) {
            return false;
        }

        let data = canvas.to
        return true;
    }

    withNSFWCheckError() {
        this.stopVideoHide();
        sendErrorLogboxMessage("Error detecting NSFW, try again later...");
    }

    withNSFWChecked(result) {

        // If NSFW, block it
        if (result) {
            sendErrorLogboxMessage("NSFW DETECTED!");
            this.stopVideoHide();
            VideoBlockerManager.blockOtherVideo("NSFW Detected");
        }

    }



}