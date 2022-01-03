let blockedList = {


}


const IPBlockingManager = {

    LOCAL_STORAGE_ID: "IP_BLOCK_CONFIG",
    DEFAULT_STORAGE_VALUE: {},


    getStoredChromeConfig(callback) {
        let blockQuery = {}
        blockQuery[IPBlockingManager.LOCAL_STORAGE_ID] = IPBlockingManager.DEFAULT_STORAGE_VALUE;
        chrome.storage.local.get(blockQuery, callback);
    },

    setStoredChromeConfig(newConfig) {
        if (newConfig == null) return;

        let pasteMenuQuery = {}
        pasteMenuQuery[IPBlockingManager.LOCAL_STORAGE_ID] = (newConfig || IPBlockingManager.DEFAULT_STORAGE_VALUE);

        chrome.storage.local.set(pasteMenuQuery);
    },
}





// TODO address blocking
function blockAddress(unhashedAddress, hashedAddress) {
    const confirmBlock = confirm(`Are you sure you want to block ${unhashedAddress}`);
    if (!confirmBlock) return;




}