const FullScreenVideoManager = {

    instances: [],

    initialize() {
        $(window).on("resize", () => FullScreenVideoManager._onWindowResize());
        document.addEventListener("pageStarted", () => FullScreenVideoManager._pageStarted());
        document.addEventListener("storageSettingsUpdate", (detail) => FullScreenVideoManager._storageSettingsUpdate(detail));

    },

    _onWindowResize() {

        FullScreenVideoManager.instances.forEach((instance) => {
            setTimeout(() => instance.updateButtonPosition(), 5);
        });

    },

    _pageStarted() {
        let videoWrapper = $("#videowrapper").get(0);
        if (videoWrapper == null) return;

        FullScreenVideoManager.instances.push(
            new VideoFullscreen(
                "otherVideoFullscreen",
                "othervideo",
                true
            )
        );

        FullScreenVideoManager.instances.forEach((instance) => {
            videoWrapper.appendChild(instance.getFullscreenButton().get(0));
            instance.updateButtonPosition();
        });

        document.addEventListener("chatEnded", () => {
            FullScreenVideoManager.instances.forEach((instance) => {
                if (instance.getDisableAfterChat()) {
                    instance.videoButtonEnabled(false)
                }
            });
        });

        document.addEventListener("videoChatLoaded", () => {
            FullScreenVideoManager.instances.forEach((instance) => {
                instance.videoButtonEnabled(true);
            });
        })

        let hiddenQuery = {}
        hiddenQuery[config.fullscreenButtonToggle.getName()] = config.fullscreenButtonToggle.getDefault();

        chrome.storage.sync.get(hiddenQuery, (result) => {
            FullScreenVideoManager.instances.forEach((instance) => {
                instance.videoButtonHidden(!(result[config.fullscreenButtonToggle.getName()] === "true"));
            });
        })

    },

    _storageSettingsUpdate(detail) {
        const result = detail["detail"][config.fullscreenButtonToggle.getName()];

        if (result != null) {
            FullScreenVideoManager.instances.forEach((instance) => {
                instance.videoButtonHidden(!(result === "true"));
            });
        }

    }

}


class VideoFullscreen {

    #fullscreenButton;
    #buttonElementId;
    #videoElementId;
    #disableAfterChat;
    #extraButtonClasses = []

    getDisableAfterChat() {
        return this.#disableAfterChat;
    }

    getFullscreenButton() {
        return this.#fullscreenButton;
    }

    #generateButton() {
        return $(
            `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFu2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuOWNjYzRkZSwgMjAyMi8wMy8xNC0xMToyNjoxOSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIzLjMgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMi0wNi0yNFQxNjo0ODoxNC0wNDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjItMDYtMjRUMTY6NTA6MDItMDQ6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjItMDYtMjRUMTY6NTA6MDItMDQ6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjMzMjVlYmZmLTg3MjctMDk0Zi05NWYwLWIzMGIwMzliYzEyNyIgeG1wTU06RG9jdW1lbnRJRD0i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"
                id="${this.#buttonElementId}" 
                       style="display: none; opacity: 0.7;" 
                       class="videoScreenshotButton ${this.#extraButtonClasses.join(' ')} noselect"
                       alt="Fullscreen">`
        ).on("click", () => this.fullscreenVideo());
    }

    constructor(buttonElementId, videoElementId, disableAfterChat, extraButtonClasses) {
        this.#buttonElementId = buttonElementId;
        this.#videoElementId = videoElementId;
        this.#disableAfterChat = disableAfterChat;
        this.#extraButtonClasses = extraButtonClasses || [];
        this.#fullscreenButton = this.#generateButton();
    }

    videoButtonEnabled(enabled) {
        $(this.#fullscreenButton).css("display", enabled ? "" : "none");
    }

    videoButtonHidden(enabled) {
        $(this.#fullscreenButton).css("visibility", enabled ? "hidden" : "visible");
    }

    static #sanitizePixelString(pixels) {
        return +(pixels.replaceAll("px", ""))
    }

    updateButtonPosition() {
        const videoElement = $(`#${this.#videoElementId}`).get(0);
        let newHeightWidth = $(videoElement).width() * 0.08;

        $(this.#fullscreenButton)
            .css("width", `${newHeightWidth}px`)
            .css("height", `${newHeightWidth}px`)

        let topOffset = (
            10
        );


        let leftOffset = (
            VideoFullscreen.#sanitizePixelString(videoElement.style.left)
            + VideoFullscreen.#sanitizePixelString(videoElement.style.width)
            - this.#fullscreenButton.width()
            - 10
        )

        $(this.#fullscreenButton)
            .css("margin-top", `${topOffset}px`)
            .css("margin-left", `${leftOffset}px`)
    }

    fullscreenVideo() {
        let video = document.getElementById("othervideo");
        let initW = (video.videoWidth * 1.15), initH = (video.videoHeight * 1.15);

        // Generate Popup
        let popup = window.open("about:blank", "_blank", `
            width=${initW},
            height=${initH},
            left=${(screen.width / 2) - (initW / 2)},
            top=${(screen.height / 2) - (initH / 2)},
            scrollbars=no,
            menubar=no,
            titlebar=no,
            toolbar=no
        `);

        // Write Popup Data
        popup.document.write(
            '<canvas id="bigVideo" style="background-color: rgba(54,57,63,255)"></canvas>'
        );

        // Style Popup Window
        $(popup.document.getElementsByTagName("body")[0])
            .css("margin", "0")
            .css("padding", "0")
            .css("background-color", "rgba(54,57,63,255)")
            .css("object-fit", "contain");

        // Create Canvas
        let canvas = popup.document.getElementById('bigVideo');
        let context = canvas.getContext('2d');

        // Style Canvas
        let cw = Math.floor(initW), ch = Math.floor(initH);
        canvas.width = cw;
        canvas.height = ch;

        // Update Canvas
        updateBigVideo(video, context, cw, ch);
        function updateBigVideo(v, c, w, h) {
            if (v.paused || v.ended) return false;
            c.drawImage(v, 0, 0, cw, ch);
            setTimeout(updateBigVideo, 10, v, c, w, h);
        }

        // When chat ends, close window
        document.addEventListener("chatEnded", () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            popup.close();
        })

        // When window is resized, resize video
        popup.addEventListener("resize", (event) => {
            cw = Math.floor(popup.innerWidth)
            ch = Math.floor(popup.innerHeight)
            canvas.width = cw;
            canvas.height = ch;
        })

    }

}
