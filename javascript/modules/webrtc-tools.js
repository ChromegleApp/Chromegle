class LeakedAddressPopup {
    #settingsModalElement = undefined;
    static #modalElementId = "modal-3";
    #disableButton = undefined;

    constructor(fakeAddress, realAddress) {
        this.#settingsModalElement = document.createElement("div");
        this.#disableButton = ButtonManager
        $(this.#settingsModalElement).load(getResourceURL("html/leaked.html"), () => {
            $("html").append(this.#settingsModalElement);
            $("#modal__fake_address").get(0).innerHTML = fakeAddress || "N/A";
            $("#modal__real__address").get(0).innerHTML = realAddress || "N/A";
            $("#modal__disable__check").replaceWith(ButtonManager.disableWebRTCCheckButton);
            MicroModal.show(LeakedAddressPopup.#modalElementId);
        });
    }

    destroy() {
        MicroModal.close(LeakedAddressPopup.#modalElementId);
        $(LeakedAddressPopup.#modalElementId).remove();
    }

}

const WebRTCLeakHandling = {

    httpAddress: null,
    leakedPubAddress: null,
    warnedUser: false,
    showMenu: false,
    popup: null,

    initialize() {
        document.addEventListener("chatStarted", () => WebRTCLeakHandling.handleLeakStatus())
    },

    checkLeakStatus(address) {

        getIPv4().then((leakedAddresses) => {

            // WebRTC not enabled (nothing leaked)
            if (leakedAddresses.length < 1) {
                Logger.INFO("WebRTC is not leaking an IP. You will not be able to use video chats.");
                return;
            }

            // Leaked IP matches HTTP IP (No proxy or proxy leaks correct IP)
            if (leakedAddresses.includes(address)) {
                Logger.INFO("WebRTC is leaking the correct IP. You will be able to use video chats.")
                return;
            }

            // Leaked IP does NOT match HTTP IP
            let leakedPubAddress = null;
            for (let ip of leakedAddresses) {
                if (!isPrivateAddress(ip)) {
                    leakedPubAddress = ip;
                    break;
                }
            }

            WebRTCLeakHandling.showMenu = true;
            WebRTCLeakHandling.leakedPubAddress = leakedPubAddress;
            WebRTCLeakHandling.httpAddress = address;

        });
    },

    handleLeakStatus() {
        // Setting Disabled
        if (config.webrtcleakWarningToggle.getLocalValue() === "false") return;

        // Not leaking
        if (!ChatRegistry.isVideoChat() || !WebRTCLeakHandling.showMenu || WebRTCLeakHandling.warnedUser) return;

        WebRTCLeakHandling.warnedUser = true;
        WebRTCLeakHandling.popup = new LeakedAddressPopup(WebRTCLeakHandling.httpAddress, WebRTCLeakHandling.leakedPubAddress);
    },


}
