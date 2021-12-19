let currentlyBlocking = false;


// Unblock Video
function unblockVideo() {
    currentlyBlocking = false;
    $(ButtonManager.coverButton).css("display", "none");
    $(document.getElementById("othervideo")).css("display", "block");
}

// Block Video
function blockVideo(otherVideo) {
    if (!ChatRegistry.isChatting()) {
        return;
    }

    currentlyBlocking = true;
    let width = otherVideo.style.width;
    let height = otherVideo.style.height;
    let top = otherVideo.style.top;

    $(ButtonManager.coverButton).css("display", "flex").css("width", width).css("height", height).css("margin-top", top);
    otherVideo.style.display = "none";

    $("#othervideospinner").css("display", "none");

}

// On resize, resize block
$(window).on("resize", () => {
    // Must have small delay to fire *after* resize occurs
    setTimeout(() => {
        if (currentlyBlocking) {
            blockVideo($("#othervideo").get(0))
        }
    }, 5);
})


document.addEventListener("pageStarted", () => {
    let otherVideo = $("#othervideo");

    // Must be video
    if (otherVideo.get(0) == null) {
        return;
    }

    $("#videowrapper").get(0).appendChild(ButtonManager.coverButton.get(0))
    $(otherVideo).on("click", (event) => blockVideo(event.target));

    document.addEventListener("chatEnded", () => {
        $(otherVideo).css("cursor", "")
        unblockVideo(otherVideo);
    });

    document.addEventListener("chatStarted", () => {
        $(otherVideo.css("cursor", "pointer"))
    })


});


