
const ButtonManager = {

    homeButton : $("<button class='homeButton'></button>")
        .on('click', function () {
            if (document.getElementById("intro") === null) window.location.href = "";

        }),

    menuButton: $("<button class='settingsButton'></button>")
        .on('click', function () {

        })

}

