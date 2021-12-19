$(document).on("ready", () => {

    ["#textbtn", "#videobtn", "#videobtnunmoderated"].forEach((button) => {
        $(button).on('click', () => {
            // Click the checkboxes
            $("input[type=checkbox]:not(:checked)").trigger("click");

            // Confirm join
            $("input[type=button][value='Confirm & continue']").trigger("click");
        });
    });

});