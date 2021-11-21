let themeManager = null;
let settingsManager = null;

MicroModal.init();

$(document).on("ready", () =>
{
    themeManager = new ThemeManager();
    themeManager.loadCurrentTheme();

   settingsManager = new SettingsManager();

    // Bind the start images to the start function
    ["#textbtn", "#videobtn", "#videobtnunmoderated"].forEach((button) => {
        $(button).on('click', () => {
            // Click the checkboxes
            $("input[type=checkbox]:not(:checked)").trigger("click");

            // Confirm join
            $("input[type=button][value='Confirm & continue']").trigger("click");
        });
    })





});