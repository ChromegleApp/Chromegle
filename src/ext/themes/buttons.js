const Buttons = {

    homeButton: $("<button class='homeButton'></button>")
        .on('click', function () {
            if (document.getElementById("intro") === null) window.location.href = "";

        }),

    menuButton: $(`<img src='${getResourceURL("public/images/SettingsButton.png")}' class='settingsButton noselect'  alt=""/>`)
        .on('click', function () {

        }),

    ipToggleButton: $("<button class='ipLookupButton' style='margin-bottom: 8px; margin-top: 6px;'></button>")
        .on('click', () => {

            let showQuery = {}
            showQuery[config.ipGrabToggle.getName()] = config.ipGrabToggle.getDefault();
            chrome.storage.sync.get(showQuery, (result) => {

                const enabled = !(result[config.ipGrabToggle.getName()] === "true");
                IPGrabberManager.ipGrabberDiv.style.display = enabled ? "" : "none";

                if (enabled) Buttons.ipToggleButton.html(IPGrabberManager.DISABLE_TAG);
                else Buttons.ipToggleButton.html(IPGrabberManager.ENABLE_TAG);
                config.ipGrabToggle.update();

            });

        }),


    autoSkipCancelButton: $(`<span class="statuslog" style="cursor: pointer; color: rgba(49,166,231,255)">cancel skipping</span>`)
        .on("click", () => AutoSkipManager._cancelSkip()),

    ipBlockButton: (unhashedAddress) => {
        return $(`<button value="${unhashedAddress}" class="ipBlockButton">(Block IP Address)</button>`)
            .on("click", () => IPBlockingManager.blockAddress(unhashedAddress))
            .get(0);
    },

    ipUnblockButton: (unhashedAddress) => {
        return $(`<button value="${unhashedAddress}" class="ipUnblockButton">(Unblock IP)</button>`)
            .on("click", () => IPBlockingManager.unblockAddress(unhashedAddress))
            .get(0);
    },

    clearInterestsButton: () => {
        return $(`<button class="clearInterestsButton">(Clear Interests)</button>`)
            .on("click", () => ClearInterestsManager.onClearInterests())
            .get(0);
    }
}

