
const ButtonManager = {

    homeButton : $("<button class='homeButton'></button>")
        .on('click', function () {
            if (document.getElementById("intro") === null) window.location.href = "";

        }),

    menuButton: $("<button class='settingsButton'></button>")
        .on('click', function () {

        }),

    ipToggleButton: $("<button class='ipLookupButton' style='margin-bottom: 8px; margin-top: 6px;'></button>")
        .on('click', () => {

            let showQuery = {}
            showQuery[config.ipGrabToggle.getName()] = config.ipGrabToggle.getDefault();
            chrome.storage.sync.get(showQuery, (result) => {

                const enabled = !(result[config.ipGrabToggle.getName()] === "true");
                IPGrabberManager.ipGrabberDiv.style.display = enabled ? "" : "none";

                if (enabled) ButtonManager.ipToggleButton.html(IPGrabberManager.disableTag);
                else ButtonManager.ipToggleButton.html(IPGrabberManager.enableTag);
                config.ipGrabToggle.update();

            });

        }),

    ipBlockButton: (unhashedAddress, hashedAddress) => {
        return $(`<button value="${unhashedAddress}" class="ipBlockButton">(Block IP)</button>`)
            .on("click", () => blockAddress(unhashedAddress, hashedAddress))
            .get(0);
    }

}

