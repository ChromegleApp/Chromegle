const ConfirmManager = {

    initialize() {
        ConfirmManager._registerEvents();
    },

    _registerEvents() {
        ["#textbtn", "#videobtn", "#videobtnunmoderated"].forEach((button) => {
            $(button).on('click', () => ConfirmManager.autoConfirm());
        });
    },

    autoConfirm() {
        // Click the checkboxes
        $("input[type=checkbox]:not(:checked)").trigger("click");

        // Confirm join
        $("input[type=button][value='Confirm & continue']").trigger("click");
    }
}


