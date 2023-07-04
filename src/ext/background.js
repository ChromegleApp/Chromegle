/**
 * Install Actions
 */
chrome.runtime.onInstalled.addListener(function (){

    // Onboarding
    chrome.tabs.create({url: "https://chromegle.net/"},function(){});

    // Refresh Omegle
    chrome.tabs.query({url: 'https://www.omegle.com/*'}).then(tabs => {
        for (let tab of tabs) {
            chrome.tabs.reload(tab.id).then();
        }
    });

})

