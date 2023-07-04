const ClearInterestsManager = {

    initialize() {
        this.insertButton();
    },

    insertButton() {

        $(".shoulduselikescheckbox")
            ?.parent()
            ?.parent()
            ?.css("display", "flex")
            .css("align-items", "center")
            .get(0)
            .appendChild(Buttons.clearInterestsButton());

    },

    onClearInterests() {

        for (let topicTag of $(".topictagwrapper > .topictag").toArray()) {
            $(topicTag).children(".topictagdelete").get(0).click();
        }


    }
}
