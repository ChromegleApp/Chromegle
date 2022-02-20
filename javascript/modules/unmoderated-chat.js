const UnmoderatedChatManager = {

    initialize() {
        $(document).on("click", (event) => UnmoderatedChatManager._nsfwChatButtonClick(event))
        $("#videobtnunmoderated").on("click", () => UnmoderatedChatManager._startObserving());
        $("#videobtn").on("click", () => UnmoderatedChatManager._startObserving());
        $("#textbtn").on("click", () => UnmoderatedChatManager._startObserving());

    },

    NSFWObserver: new MutationObserver((mutationRecord) => {

        for (let mutation of mutationRecord) {
            if (mutation.target.nodeName === "BUTTON") {
                // noinspection JSUnresolvedVariable
                if (mutation.target.classList.contains("lowergaybtn")) {
                    UnmoderatedChatManager.cleanPage();
                    return;
                }
            }

        }
    }),

    _startObserving() {
        UnmoderatedChatManager.NSFWObserver.observe(document, {attributes: true, childList: true, subtree:true});
        document.addEventListener("chatEnded", () => UnmoderatedChatManager.cleanChat());
        document.addEventListener("chatFailedConnect", () => UnmoderatedChatManager.cleanChat());

        // Clean page
        setTimeout(() => UnmoderatedChatManager.cleanPage(), 10);

    },

    _nsfwChatButtonClick(event) {
        if (event.target.innerText === "unmoderated section") {
            ConfirmManager.autoConfirm();
            UnmoderatedChatManager.cleanPage();
            UnmoderatedChatManager._startObserving();
        }
    },

    cleanChat() {
        $("img[alt='Gay']").remove();
        $("img[alt='Sexy']").remove();
    },

    cleanPage() {
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


}




