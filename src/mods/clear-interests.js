class ClearInterestsManager extends Module {

    constructor() {
        super();
        this.insertButton();
    }

    insertButton() {
        $(".shoulduselikescheckbox")
            ?.parent()
            ?.parent()
            ?.css("display", "flex")
            .css("align-items", "center")
            .get(0)
            .appendChild(this.createElement());
    }

    createElement() {
        return $(`<button class="clearInterestsButton">(Clear Interests)</button>`)
            .on("click", this.onButtonClick.bind(this))
            .get(0);
    }

    onButtonClick() {
        for (let topicTag of $(".topictagwrapper > .topictag").toArray()) {
            $(topicTag).children(".topictagdelete").get(0).click();
        }
    }

}
