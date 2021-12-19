function autoConfirm() {
    // Click the checkboxes
    $("input[type=checkbox]:not(:checked)").trigger("click");

    // Confirm join
    $("input[type=button][value='Confirm & continue']").trigger("click");
}

document.addEventListener("startUpEvent",() => {

    ["#textbtn", "#videobtn", "#videobtnunmoderated"].forEach((button) => {
        $(button).on('click', () => autoConfirm());
    });

});
