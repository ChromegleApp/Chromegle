class MuteMicrophone {

    #muteButton;
    #buttonElementId;
    #videoElementId;
    #disableAfterChat;
    #extraButtonClasses = []

    static #enabledValue = "data:image/png;base64,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";
    static #disabledValue = "data:image/png;base64,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";

    getDisableAfterChat() {
        return this.#disableAfterChat;
    }

    getMuteButton() {
        return this.#muteButton;
    }

    #generateButton() {
        return $(
            `<img src="${MuteMicrophone.#enabledValue}" 
                       id="${this.#buttonElementId}" 
                       style="display: none; bottom: 0;" 
                       class="videoMuteButton ${this.#extraButtonClasses.join(' ')} noselect"
                       alt="Mute Microphone">`
        ).on("click", () => this.toggleMuteVideo());
    }

    constructor(buttonElementId, videoElementId, disableAfterChat, extraButtonClasses) {
        this.#buttonElementId = buttonElementId;
        this.#videoElementId = videoElementId;
        this.#disableAfterChat = disableAfterChat;
        this.#extraButtonClasses = extraButtonClasses || [];
        this.#muteButton = this.#generateButton();
    }

    videoButtonEnabled(enabled) {
        $(this.#muteButton).css("display", enabled ? "" : "none");
    }

    videoButtonHidden(enabled) {
        $(this.#muteButton).css("visibility", enabled ? "hidden" : "visible");
    }
    static #sanitizePixelString(pixels) {

        return +(pixels.replaceAll("px", ""))
    }

    updateButtonPosition() {
        const videoElement = $(`#${this.#videoElementId}`).get(0);
        let newHeightWidth = $(videoElement).width() * 0.08;

        $(this.#muteButton)
            .css("width", `${newHeightWidth}px`)
            .css("height", `${newHeightWidth}px`)

        let topOffset = (
            MuteMicrophone.#sanitizePixelString(videoElement.style.top)
            + MuteMicrophone.#sanitizePixelString(videoElement.style.height)
            - this.#muteButton.height()
            - 10
        );


        let leftOffset = (
            MuteMicrophone.#sanitizePixelString(videoElement.style.left)
            + MuteMicrophone.#sanitizePixelString(videoElement.style.width)
            - this.#muteButton.width()
            - 10
        )

        $(this.#muteButton)
            .css("margin-top", `${topOffset}px`)
            .css("margin-left", `${leftOffset}px`)
    }

    toggleMuteVideo() {
        let selfVideoStream = $("#selfvideo").get(0).captureStream()
        let audioStreams = selfVideoStream.getAudioTracks();

        if (audioStreams.length < 1) {
            Logger.ERROR(`Audio stream not found for chat UUID <${ChatRegistry.getUUID()}>`)
            return;
        }

        let audioStream = audioStreams[0]

        if (audioStream.enabled) {
            audioStream.enabled = false;
            this.#muteButton.get(0).src = MuteMicrophone.#disabledValue;
        } else {
            audioStream.enabled = true;
            this.#muteButton.get(0).src = MuteMicrophone.#enabledValue;
        }

    }
}

const MuteMicrophoneManager = {

    instances: [],

    initialize() {
        $(window).on("resize", () => MuteMicrophoneManager._onWindowResize());
        document.addEventListener("pageStarted", () => MuteMicrophoneManager._pageStarted());
        document.addEventListener("storageSettingsUpdate", (detail) => MuteMicrophoneManager._storageSettingsUpdate(detail));

    },

    _onWindowResize() {

        MuteMicrophoneManager.instances.forEach((instance) => {
            setTimeout(() => instance.updateButtonPosition(), 5);
        });

    },

    _pageStarted() {
        let videoWrapper = $("#videowrapper").get(0);
        if (videoWrapper == null) return;

        MuteMicrophoneManager.instances.push(
            new MuteMicrophone(
                "selfVideoMute",
                "selfvideo",
                false
            )
        );

        MuteMicrophoneManager.instances.forEach((instance) => {
            videoWrapper.appendChild(instance.getMuteButton().get(0));
            instance.updateButtonPosition();
        });

        document.addEventListener("chatEnded", () => {
            MuteMicrophoneManager.instances.forEach((instance) => {
                if (instance.getDisableAfterChat()) {
                    instance.videoButtonEnabled(false)
                }
            });
        });

        document.addEventListener("videoChatLoaded", () => {
            MuteMicrophoneManager.instances.forEach((instance) => {
                instance.videoButtonEnabled(true);
            });
        })

        let hiddenQuery = {}
        hiddenQuery[config.muteButtonToggle.getName()] = config.muteButtonToggle.getDefault();

        chrome.storage.sync.get(hiddenQuery, (result) => {
            MuteMicrophoneManager.instances.forEach((instance) => {
                instance.videoButtonHidden(!(result[config.muteButtonToggle.getName()] === "true"));
            });
        })


    },

    _storageSettingsUpdate(detail) {
        const result = detail["detail"][config.muteButtonToggle.getName()];

        if (result != null) {
            MuteMicrophoneManager.instances.forEach((instance) => {
                instance.videoButtonHidden(!(result === "true"));
            });
        }

    }

}







