const WebRTCLeakHandling = {

    httpAddress: null,
    leakedPubAddress: null,
    warnedUser: false,
    showMenu: false,
    popup: null,

    initialize() {

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
    }

}
