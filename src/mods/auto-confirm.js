class ConfirmManager extends Module {

    constructor() {
        super();

        // Listen for click
        this.addMultiElementListener(
            "click", this.onButtonClick, "#textbtn", "#videobtn", "#videobtnunmoderated"
        );
    }

    onButtonClick() {
        $("input[type=checkbox]:not(:checked)").trigger("click"); // Checkboxes
        $("input[type=button][value='Confirm & continue']").trigger("click"); // Confirmation
    }
}


