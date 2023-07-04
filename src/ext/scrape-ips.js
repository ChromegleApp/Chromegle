document.addEventListener('scrapeAddress', () => {

    window.oRTCPeerConnection = (window.oRTCPeerConnection || window.RTCPeerConnection);

    // Override the RTC peer connection creation to scrape our data
    window.RTCPeerConnection = function (...args) {

        // Only log the IP once
        let logged = false;

        const conn = new window.oRTCPeerConnection(...args)
        conn.oaddIceCandidate = conn.addIceCandidate;

        // Override adding ice candidates to scrape our data
        conn.addIceCandidate = async function (iceCandidate, ...rest) {
            let fields = iceCandidate.candidate.split(' ');

            // The field name "srflx" is an identifier for the server reflexive candidate
            // When this is detected as part of a data packet, the peer's IP address is included in that data
            // So we look for and scrape the data when we know it is included, which it will be in an srflx call
            if (!logged && (fields[7] === 'srflx')) {
                logged = true;
                window.dispatchEvent(new CustomEvent("displayScrapeData", {detail: fields[4]}));
            }

            return conn.oaddIceCandidate(iceCandidate, ...rest);

        }

        // Return the connection
        return conn;

    }

});