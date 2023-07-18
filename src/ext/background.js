/**
 * Install Actions
 */
chrome.runtime.onInstalled.addListener(async function (){

    // Check if it's been installed
    let query = {HAS_BEEN_INSTALLED: "false"};
    let hasBeenInstalled = (await chrome.storage.sync.get(query))["HAS_BEEN_INSTALLED"];
    if (hasBeenInstalled === "true") {
        return;
    }

    // Set to has been installed
    query["HAS_BEEN_INSTALLED"] = "true";
    await chrome.storage.sync.set(query);

    // Onboarding
    chrome.tabs.create({url: "https://chromegle.net/installed"},function(){});

    // Refresh Omegle
    chrome.tabs.query({url: 'https://www.omegle.com/*'}).then(tabs => {
        for (let tab of tabs) {
            chrome.tabs.reload(tab.id).then();
        }
    });

})

