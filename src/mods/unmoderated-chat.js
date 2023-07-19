class UnmoderatedChatManager extends Module {

    constructor() {
        super();
        this.observer = null;
        this.addMultiElementListener(
            "click", this.onStartButtonClick, "#videobtnunmoderated", "#videobtn", "#textbtn"
        );

    }

    /**
     * Listen for start button click
     */
    onStartButtonClick() {
        this.cleanPage();
        this.observer = this.createMutationObserver();
        this.observer.observe(document, {attributes: true, childList: true, subtree:true});

        this.addMultiEventListener(
            this.cleanChat,
            undefined,
            "chatEnded", "chatFailedConnect"
        )

    }

    /**
     * Create mutation observer to check for newly added NSFW ads
     * @returns {MutationObserver}
     */
    createMutationObserver() {
        return new MutationObserver((mutationRecord) => {
            for (let mutation of mutationRecord) {
                if (mutation.target.classList.contains("lowergaybtn")) {
                    this.cleanPage();
                }
                if (mutation.target.attr) {

                }
            }
        });
    }

    /**
     * Remove porn advertisements from page & insert our discord button
     */
    cleanPage() {
        $(".lowergaybtnwrapper").remove();
        $(".lowersexybtnwrapper").remove();

        this.#replacePornButton();

        let noButton = $('span:contains("No")');
        if (noButton.get(0) != null) noButton.trigger("click");

    }

    /**
     * Replace porn button with discord button
     */
    #replacePornButton() {

        let pornButton = $("#abovevideosexybtn");
        pornButton.replaceWith(pornButton.clone()
            .css("background", "")
            .css("font-size", "20px")
            .html(`
                <a href="${ConstantValues.discordURL}" target="_blank" style="text-decoration: none;">
                    <strong>Chromegle Discord (NO NSFW)</strong>
                </a>
            `)
        );

        $("#othervideo").css("border-top-left-radius", "0px")

    }

    /**
     * Remove "Gay" and "Sexy" buttons from chat
     */
    cleanChat() {
        $("img[alt='Gay']").remove();
        $("img[alt='Sexy']").remove();
    }


}






