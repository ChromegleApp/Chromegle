class VideoWrapperManager extends Module {

    static otherVideoWrapperId = "otherVideoWrapper";
    static selfVideoWrapperId = "selfVideoWrapper";

    config = {
        othervideo: VideoWrapperManager.otherVideoWrapperId,
        selfvideo: VideoWrapperManager.selfVideoWrapperId
    }

    #observer = new MutationObserver(this.onMutationObserved.bind(this));

    constructor(props) {
        super(props);
    }

    onPageStarted() {

        if (!ChatRegistry.isVideoChat()) {
            return;
        }

        this.wrapVideos();
        this.#observer.observe(
            document.getElementById("videowrapper"),
            {subtree: true, childList: true, attributes: true, attributeFilter: ['style']}
        );



    }

    onMutationObserved(mutation) {

        for (let mutationRecord of mutation) {
            if (mutationRecord.target.id === "othervideo" || mutationRecord.target.id === "selfvideo") {

                this.updateWrapperDimensions(
                    this.config[mutationRecord.target.id],
                    mutationRecord.target
                );

            }

        }
    }

    updateWrapperDimensions(wrapperId, target) {

        let wrapper = $(`#${wrapperId}`)
            .css("width", target.style.width)
            .css("height", target.style.height)

        if (target.style.top) {
            wrapper.css("top", target.style.top);
            target.style.top = "";
        }

    }

    wrapVideos() {

        let otherVideo = $("#othervideo");
        let selfVideo = $("#selfvideo");

        // Do the wrap
        otherVideo.wrap(`<div id='${VideoWrapperManager.otherVideoWrapperId}'></div>`);
        selfVideo.wrap(`<div id='${VideoWrapperManager.selfVideoWrapperId}'></div>`);

        // Update dimensions for the first time (further will be handled by MutationObserver)
        this.updateWrapperDimensions(
            VideoWrapperManager.otherVideoWrapperId,
            otherVideo.get(0)
        );

        this.updateWrapperDimensions(
            VideoWrapperManager.selfVideoWrapperId,
            selfVideo.get(0)
        );


        // Emit event
        document.dispatchEvent(new CustomEvent('wrappedVideos'));

    }

}
