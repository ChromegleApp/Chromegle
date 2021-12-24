/**
 * ONLY run this if they click the NSFW button :D
 */
$("#videobtnunmoderated").on("click", () => startNSFWObserving());
$("#videobtn").on("click", () => startNSFWObserving());
$("#textbtn").on("click", () => startNSFWObserving());

/**
 * Video chat -> NSFW Chat
 */
$(document).on("click", (event) => {
    if (event.target.innerText === "unmoderated section") {
        autoConfirm();
        cleanPage();
        startNSFWObserving();
    }

})

function startNSFWObserving() {
    nsfwObserver.observe(document, {attributes: true, childList: true, subtree:true});
}

/**
 * Clean the page on load
 */
function cleanPage() {
    $(".lowergaybtnwrapper").remove();
    $(".lowersexybtnwrapper").remove();

    let aboveButton = $("#abovevideosexybtn");

    let aboveButtonClone = aboveButton.clone()
        .css("background", "")
        .css("font-size", "20px")
        .addClass("videoCoverButton")

    let aboveClone = aboveButtonClone.get(0);
    if (aboveClone != null) {
        aboveClone.innerHTML = (
            `<a href="${ConstantValues.discordURL}" target="_blank" style="text-decoration: none;">
         <strong>Chromegle Discord (NO NSFW)</strong>
         </a>`
        );
    }

    $(aboveButton).replaceWith(aboveButtonClone);

    let noButton = $('span:contains("No")');
    if (noButton.get(0) != null) noButton.trigger("click");

}

/**
 * Run some stuff when the chat ends or fails to connect
 */
document.addEventListener("chatEnded", () => cleanChatEnd());
document.addEventListener("chatFailedConnect", () => cleanChatEnd());

const cleanChatEnd = () => {
    $("img[alt='Gay']").remove();
    $("img[alt='Sexy']").remove();
}


/**
 * Observe for changes in DOM
 */
let nsfwObserver = new MutationObserver((mutationRecord) => {

    for (let mutation of mutationRecord) {
        if (mutation.target.nodeName === "BUTTON") {
            // noinspection JSUnresolvedVariable
            if (mutation.target.classList.contains("lowergaybtn")) {
                cleanPage();
                return;
            }
        }

    }
});



