class VideoBlockerManager extends Module {

    static mobileSupported = false;
    static #otherBlockerExt = null;

    #otherBlocker = null;
    #selfBlocker = null;

    constructor() {
        super();
    }

    static blockOtherVideo(text = null) {
        VideoBlockerManager.#otherBlockerExt.showBlocker(text);
    }

    onWrappedVideos() {

        // Self Blocker
        this.#selfBlocker = new VideoBlocker(
            "selfvideo",
            "selfVideoBlocker",
            false
        )

        // Other Blocker
        this.#otherBlocker = VideoBlockerManager.#otherBlockerExt = new VideoBlocker(
            "othervideo",
            "otherVideoBlocker",
            true
        )

        // Add to document
        this.#selfBlocker.appendChildTo(document.getElementById(VideoWrapperManager.selfVideoWrapperId));
        this.#otherBlocker.appendChildTo(document.getElementById(VideoWrapperManager.otherVideoWrapperId));

    }

    onChatEnded() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        this.#otherBlocker.onChatEnded();
        this.#selfBlocker.onChatEnded();
    }

    onVideoLoaded() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        this.#otherBlocker.onVideoLoaded();
        this.#selfBlocker.onVideoLoaded();
    }

}

class VideoBlocker {

    #element = null;
    #subtextElement = null;
    #videoElement;
    #elementId;
    #whileChatting;
    #videoLoaded = false;

    constructor(videoId, elementId, whileChatting) {
        this.#elementId = elementId;
        this.#whileChatting = whileChatting;
        this.#videoElement = document.getElementById(videoId);
    }

    appendChildTo(element) {
        let blocker = this.generateBlocker().get(0);
        element.appendChild(blocker);
        this.#element = blocker;
        this.#subtextElement = document.getElementById("videoCoverSubtext");
    }

    onChatEnded() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        if (this.#whileChatting) {
            this.#element.style.cursor = "inherit";
            this.hideBlocker();
        }

        this.#videoLoaded = false;
    }

    onVideoLoaded() {

        if (this.#whileChatting) {
            this.#element.style.cursor = "pointer";
        }

        this.#videoLoaded = true;

    }

    generateBlocker() {

        return $(
            `<div 
                       id="${this.#elementId}" class="videoCoverButton">
                        <div class="nsfwCoverTextWrapper">
                            <p style="margin: auto;" class="noselect">
                                Click to Unblock
                                <span id="videoCoverSubtext"></span>
                            </p>
                        </div>
                  </div>`
        ).on("click", this.onBlockerButtonClick.bind(this));
    }

    onBlockerButtonClick() {

        if (this.#whileChatting && !this.#videoLoaded) {
            return;
        }

        this.isActive() ? this.hideBlocker() : this.showBlocker();
    }

    isActive() {
        return this.#element.classList.contains("shown");
    }

    showBlocker(text) {
        this.#videoElement.style.opacity = "0";
        this.#element.classList.add("shown");
        this.#subtextElement.innerText = text || "";
    }

    hideBlocker() {
        this.#videoElement.style.opacity = "";
        this.#element.classList.remove("shown");
        this.#subtextElement.innerText = "";
    }

}


