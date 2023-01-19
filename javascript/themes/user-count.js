const UserCountManager = {
    initialized: false,

    genUserCount(users = 0) {

        let element = $(
            `<div id="chromegleUserCount" class="noselect">
                    <span class="userCountNum">${users}+</span>
                    <span class="userCountDesc">Online Chromeglers</span>
                  </div>
                `
        )

        if (users === -1 || users == null) {
            element.css("display", "none");
        }

        return element.get(0);
    },

    initialize() {
        $("#menucontainer").get(0).appendChild(UserCountManager.genUserCount(-1));
        if (!UserCountManager.initialized) {
            UserCountManager.initialized = true;
            UserCountManager.update();
            setInterval(() => {
                UserCountManager.update();
            }, 1000 * 300);
        }
    },

    update() {
        let request = new XMLHttpRequest();
        request.timeout = 5000;
        request.open("GET", `${ConstantValues.apiURL}users`, true);
        request.onreadystatechange = () => UserCountManager.displayUserCount(request);
        request.send();
    },

    displayUserCount(request) {

        // Request not done yet
        if (!(request.readyState === 4)) {
            return;
        }

        let response = null;
        try {
            response = JSON.parse(request.responseText);
        } catch (ex) {
            return;
        }

        $("#chromegleUserCount").get(0).replaceWith(UserCountManager.genUserCount(response?.count));
    }

}
