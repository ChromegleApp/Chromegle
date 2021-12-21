const config = {
    "greetingMessageField": new MutableMultiEditField({
        "storageName": "GREETING_MESSAGE_FIELD",
        "prompt": "Enter the %n message to display on join:",
        "default": ["Hello there!"],
        "times": 3,
        "min": 1,
        "max": 15,
        "check": (_response) => {
            const checker = arr => arr.every(v => v=== null);

            if (_response == null || _response === "null" || (_response != null && checker(_response))) {
                return {
                    "confirm": "false",
                    "value": null
                };
            }

            let response = [];
            for (let __response of _response) {
                if (__response == null || __response.trim().length < 1) continue;
                response.push(__response);
            }

            return {"confirm": "true", "value": response}

        },
    }),
    "typingSpeedField": new FieldEdit({
        "storageName": "GREETING_TYPING_SPEED",
        "prompt": "Enter a new speed (wpm) for keyboard typing:",
        "default": 200,
        "check": (response) => {

            if (!isNumeric(response)) {
                return {
                    "confirm": "false",
                    "value": null
                };
            }
            else if (response > 1000) {
                return {
                    "confirm": "true",
                    "value": 1000
                };
            } else if (response < 20) {
                return {
                    "confirm": "true",
                    "value": 20
                };
            } else {
                return {
                    "confirm": "true",
                    "value": response
                };
            }

        }
    }),
    "toggleGreeting": new ToggleEdit({
        "elementName": "toggleGreeting",
        "storageName": "GREETING_TOGGLE",
        "default": "false",
        "warning": {
            "message": "Chromegle is not a spam-bot. Abusing auto-message to send recurring, frequent messages will eventually result in an Omegle ban. " +
                "Use this feature responsibly, with a VPN. We're not responsible for any stupid things you do, nor will we cater to spam of Omegle's platform.",
            "state": "true"
        }
    }),
    "startTypingDelayField": new FieldEdit({
        "storageName": "GREETING_STARTING_DELAY",
        "prompt": "Enter a new delay to wait before starting to type messages:",
        "default": 5,
        "check": (response) => {

            if (!isNumeric(response)) {
                return {
                    "confirm": "false",
                    "value": null
                };
            }
            else if (response > 30) {
                return {
                    "confirm": "true",
                    "value": 30
                };
            } else if (response < 0) {
                return {
                    "confirm": "true",
                    "value": 0
                };
            } else {
                return {
                    "confirm": "true",
                    "value": response
                };
            }

        }
    }),
    "sendDelayField": new FieldEdit({
        "storageName": "GREETING_SEND_DELAY",
        "prompt": "Enter a new delay to wait before sending typed messages:",
        "default": 1,
        "check": (response) => {

            if (!isNumeric(response)) {
                return {
                    "confirm": "false",
                    "value": null
                };
            }
            else if (response > 30) {
                return {
                    "confirm": "true",
                    "value": 30
                };
            } else if (response < 0) {
                return {
                    "confirm": "true",
                    "value": 0
                };
            } else {
                return {
                    "confirm": "true",
                    "value": response
                };
            }

        }
    }),
    "autoSkipDelayField": new FieldEdit({
        "storageName": "AUTO_SKIP_FIELD",
        "prompt": "Enter a new delay to wait before skipping to the next person:",
        "default": 10,
        "check": (response) => {

            if (!isNumeric(response)) {
                return {
                    "confirm": "false",
                    "value": null
                };
            }
            else if (response > 1000) {
                return {
                    "confirm": "true",
                    "value": 1000
                };
            } else if (response < 5) {
                return {
                    "confirm": "true",
                    "value": 5
                };
            } else {
                return {
                    "confirm": "true",
                    "value": response
                };
            }

        }
    }),
    "autoSkipToggle": new ToggleEdit({
        "elementName": "autoSkipToggle",
        "storageName": "AUTO_SKIP_TOGGLE",
        "default": "false",
        "warning": {
            "message": "Chromegle is not a spam-bot. Abusing auto-skip in combination with the auto-message feature to send recurring, frequent messages will " +
                "eventually result in an Omegle ban. Use this feature responsibly with a VPN if you plan to combine the two. We are not responsible for " +
                "any stupid things you do, nor will we cater to spam of Omegle's platform.",
            "state": "true"
        }
    }),
    "autoReconnectToggle": new ToggleEdit({
        "elementName": "autoReconnectToggle",
        "storageName": "AUTO_RECONNECT_TOGGLE",
        "default": "false"
    }),
    "ipGrabToggle": new ToggleEdit({
        "elementName": "ipGrabToggle",
        "storageName": "IP_GRAB_TOGGLE",
        "default": "false"
    }),
    "geoLocateToggle": new ToggleEdit({
        "elementName": "geoLocateToggle",
        "storageName": "GEO_LOCATE_TOGGLE",
        "default": "false"
    }),
    "sexualFilterToggle": new ToggleEdit({
        "elementName": "sexualFilterToggle",
        "storageName": "SEXUAL_FILTER_TOGGLE",
        "default": "false"
    }),
    "profanityFilterToggle": new ToggleEdit({
        "elementName": "profanityFilterToggle",
        "storageName": "PROFANITY_FILTER_TOGGLE",
        "default": "false"
    }),
    "ultraDarkModeOption": new ThemeSwitchEdit({
        "elementName": "ultraDarkModeOption",
        "otherElementNames": ["semiDarkModeOption", "semiLightModeOption"],
        "storageName": "THEME_CHOICE_SWITCH",
        "default": "semiLightModeOption",
        "value": "/css/themes/ultradark.css"
    }),
    "semiDarkModeOption": new ThemeSwitchEdit({
        "elementName": "semiDarkModeOption",
        "otherElementNames": ["ultraDarkModeOption", "semiLightModeOption"],
        "storageName": "THEME_CHOICE_SWITCH",
        "default": "semiLightModeOption",
        "value": "/css/themes/semidark.css"
    }),
    "semiLightModeOption": new ThemeSwitchEdit({
        "elementName": "semiLightModeOption",
        "otherElementNames": ["semiDarkModeOption", "ultraDarkModeOption"],
        "storageName": "THEME_CHOICE_SWITCH",
        "default": "semiLightModeOption",
        "value": "/css/themes/semilight.css"
    }),
    "headerButtonsToggle": new ThemeToggleEdit({
        "elementName": "headerButtonsToggle",
        "storageName": "HEADER_BUTTONS_TOGGLE",
        "default": "true"
    }),
    "screenshotButtonToggle": new ToggleEdit({
        "elementName": "screenshotButtonToggle",
        "storageName": "SCREENSHOT_BUTTON_TOGGLE",
        "default": "false"
    }),

}