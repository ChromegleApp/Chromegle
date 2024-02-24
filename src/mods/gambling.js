// gambling.js

// Function to remove the ad and image with specified src
function removeAd() {
    // Find the <a> tag with the specified href attribute
    var adLink = document.querySelector('a[href="https://mysteryboxbrand.com/?ad"][target="_blank"]');
    
    // Check if the <a> tag exists
    if (adLink) {
        // Remove the <a> tag
        adLink.parentNode.removeChild(adLink);
    }

    // Find the <img> tag with the specified src attribute
    var adImage = document.querySelector('img[src="/assets/mb.png"][alt="Open Mystery Boxes Online!"]');

    // Check if the <img> tag exists
    if (adImage) {
        // Remove the <img> tag
        adImage.parentNode.removeChild(adImage);
    }
}

// Run the removeAd function when the page is fully loaded
window.onload = function() {
    removeAd();
};