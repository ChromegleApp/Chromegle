class ConfirmManager extends Module {

    constructor() {
        super();

        // Listen for click
        this.addMultiElementListener(
            "click", this.onButtonClick,
            "#textbtn", "#videobtn", "#videobtnunmoderated", "#chatbtn", '[src*="/static/videobtn-enabled"]'
        );

        // Listen for page click
        this.addEventListener("click", this.onLinkClick);
    }

    onLinkClick(event) {

        if (event.target.innerText === "unmoderated section" && event) {
            this.onButtonClick();
        }

    }

    onButtonClick() {
        $("input[type=checkbox]:not(:checked)").trigger("click"); // Checkboxes
        $("input[type=button][value='Confirm & continue']").trigger("click"); // Confirmation
    }
}


