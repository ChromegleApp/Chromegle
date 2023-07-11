const Buttons = {

    homeButton: $("<button class='homeButton'></button>")
        .on('click', function () {
            if (document.getElementById("intro") === null) window.location.href = "";

        }),

    menuButton: $(`<img src='${getResourceURL("public/images/SettingsButton.png")}' class='settingsButton noselect'  alt=""/>`)
        .on('click', function () {

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

