
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
                ipGrabberDiv.style.display = enabled ? "" : "none";

                if (enabled) ButtonManager.ipToggleButton.html(disableTag);
                else ButtonManager.ipToggleButton.html(enableTag);
                config.ipGrabToggle.update();

            });

        }),

    coverButton: $(
        `<div id="coverButton" style="-webkit-border-top-left-radius: 0.5em; display: none; cursor: pointer;" class="nsfwbutton">
                <div class="nsfwCoverTextWrapper">
                    <p style="margin: auto;">Click to Unblock</p>
                </a>
             </div>`
    ).on("click", () => unblockVideo())

}

