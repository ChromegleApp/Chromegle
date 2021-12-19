function cleanPage() {
    $(".lowergaybtnwrapper").remove();
    $(".lowersexybtnwrapper").remove();

    let aboveButton = $("#abovevideosexybtn");

    let aboveButtonClone = aboveButton.clone()
        .css("background", "")
        .css("font-size", "20px")
        .addClass("nsfwbutton")

    aboveButtonClone.get(0).innerHTML = (
        `<a href="${ConstantValues.discordURL}" target="_blank" style="text-decoration: none;">
         <strong>Chromegle Discord (NO NSFW)</strong>
         </a>`
    );

    $(aboveButton).replaceWith(aboveButtonClone);

    let noButton = $('span:contains("No")');
    if (noButton.get(0) != null) noButton.trigger("click");

}

document.addEventListener("chatEnded", () => {
    $("img[src='/static/sexbtn.png?xx']").remove();
    $("img[src='/static/gaybtnorange.png']").remove();

});


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


document.addEventListener("pageStarted", () => {
    const isNSFW = document.getElementById("abovevideosexybtn") !== null;
    if (!isNSFW) return;

    cleanPage();
    nsfwObserver.observe(document, {attributes: true, childList: true, subtree:true});
});