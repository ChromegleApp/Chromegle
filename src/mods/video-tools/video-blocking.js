class VideoBlockerManager extends Module {

    #otherBlocker = null;
    #selfBlocker = null;

    constructor() {
        super();
    }

    onWrappedVideos() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        // Self Blocker
        this.#selfBlocker = new VideoBlocker(
            "selfvideo",
            "selfVideoBlocker",
            false
        )

        // Other Blocker
        this.#otherBlocker = new VideoBlocker(
            "othervideo",
            "otherVideoBlocker",
            true
        )

        // Add to document
        this.#selfBlocker.appendChildTo(document.getElementById(VideoWrapperManager.selfVideoWrapperId));
        this.#otherBlocker.appendChildTo(document.getElementById(VideoWrapperManager.otherVideoWrapperId));

    }

    onChatEnded() {
        this.#otherBlocker.onChatEnded();
        this.#selfBlocker.onChatEnded();
    }

    onVideoLoaded() {
        this.#otherBlocker.onVideoLoaded();
        this.#selfBlocker.onVideoLoaded();
    }

}

class VideoBlocker {

    #element = null;
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
    }

    onChatEnded() {

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
                            <p style="margin: auto;" class="noselect">Click to Unblock</p>
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

    showBlocker() {
        this.#videoElement.style.opacity = "0";
        this.#element.classList.add("shown");
    }

    hideBlocker() {
        this.#videoElement.style.opacity = "";
        this.#element.classList.remove("shown");
    }

}


