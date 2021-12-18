let themeManager = null;
let settingsManager = null;
let chatRegistry = null;


MicroModal.init();

$(document).on("ready", () =>
{
    themeManager = new ThemeManager();
    themeManager.loadCurrentTheme();

    settingsManager = new SettingsManager();

    chatRegistry = new ChatRegistry();
    chatRegistry.startObserving();

    // Bind the start images to the start function
    ["#textbtn", "#videobtn", "#videobtnunmoderated"].forEach((button) => {
        $(button).on('click', () => {
            // Click the checkboxes
            $("input[type=checkbox]:not(:checked)").trigger("click");

            // Confirm join
            $("input[type=button][value='Confirm & continue']").trigger("click");
        });
    });

    let script = document.createElement('script');
    script.src = chrome.runtime.getURL('/javascript/automation/web-accessible-scripts/scrape-ips.js')
    script.onload = () => {script.remove(); document.dispatchEvent(new CustomEvent('scrapeAddress'))};
    (document.head || document.documentElement).appendChild(script);

});

