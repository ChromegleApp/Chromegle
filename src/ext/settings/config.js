const config = {
    "greetingMessageField": new MutableMultiEditField({
        "storageName": "GREETING_MESSAGE_MULTI_FIELD",
        "prompt": "Enter the %n message to display on join:",
        "default": ["Hello there!"],
        "times": 3,
        "min": 0,
        "max": 15,
        "check": (_response) => {
            const checker = arr => arr.every(v => v === null);

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
            } else if (response > 1000) {
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
    "greetingToggle": new ToggleEdit({
        "elementName": "greetingToggle",
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
            } else if (response > 30) {
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
            } else if (response > 30) {
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
            } else if (response > 1000) {
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
    "countrySkipToggle": new ToggleEdit({
        "elementName": "countrySkipToggle",
        "storageName": "COUNTRY_SKIP_TOGGLE",
        "default": "false",
        "warning": {
            "message": "This feature may get you banned for spam-skipping. By enabling it you agree you are aware of the risk of being banned using automation "
                + "tools like this one provided by Chromegle.",
            "state": "true"
        }
    }),
    "countrySkipInfo": new FieldEdit({
        "storageName": "COUNTRY_SKIP_FIELD",
        "prompt": "Enter the countries you wish to skip as country codes, separated by commas. " +
            "These can be 2 or 3 letter codes.\n\nVisit https://www.iban.com/country-codes for the full, up-to-date list of available country codes.",
        "default": "KP,VA",
        "check": (response) => {

            // Accept all no-values
            if (response !== "") {

                // Check alphabetical
                if (response == null || (!response.match(/^[a-zA-Z,]+$/))) {
                    return {
                        "confirm": "false",
                        "value": ""
                    };
                }

                let split = new Set();
                for (let code of response.split(",")) {
                    if (code.length < 2 || code.length > 3) {
                        return {
                            "confirm": "false",
                            "value": ""
                        };
                    } else {
                        split.add(code.toUpperCase());
                    }
                }
                response = [...split].join(",")

            }

            return {
                "confirm": "true",
                "value": response
            };
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
    "ultraDarkModeOption": new SwitchEdit({
        "elementName": "ultraDarkModeOption",
        "otherElementNames": ["semiDarkModeOption", "semiLightModeOption"],
        "storageName": "THEME_CHOICE_SWITCH",
        "default": "semiLightModeOption",
        "value": "/public/css/themes/ultradark.css"
    }),
    "semiDarkModeOption": new SwitchEdit({
        "elementName": "semiDarkModeOption",
        "otherElementNames": ["ultraDarkModeOption", "semiLightModeOption"],
        "storageName": "THEME_CHOICE_SWITCH",
        "default": "semiLightModeOption",
        "value": "/public/css/themes/semidark.css"
    }),
    "semiLightModeOption": new SwitchEdit({
        "elementName": "semiLightModeOption",
        "otherElementNames": ["semiDarkModeOption", "ultraDarkModeOption"],
        "storageName": "THEME_CHOICE_SWITCH",
        "default": "semiLightModeOption",
        "value": "/public/css/themes/semilight.css"
    }),
    "headerButtonsToggle": new ToggleEdit({
        "elementName": "headerButtonsToggle",
        "storageName": "HEADER_BUTTONS_TOGGLE",
        "default": "false"
    }),
    "videoToolsButtonToggle": new ToggleEdit({
        "elementName": "videoToolsButtonToggle",
        "storageName": "VIDEO_TOOLS_BUTTON_TOGGLE",
        "default": "false"
    }),
    "skipRepeatsToggle": new ToggleEdit({
        "elementName": "skipRepeatsToggle",
        "storageName": "SKIP_REPEATS_TOGGLE",
        "default": "false"
    }),
    "pasteMenuToggle": new ToggleEdit({
        "elementName": "pasteMenuToggle",
        "storageName": "PASTE_MENU_TOGGLE",
        "default": "false"
    }),
    "blockedIPList": new ExternalField({
        "external": IPBlockingMenu.loadMenu
    }),
    "unblockAllIPAddresses": new ExternalField({
        "external": IPBlockingMenu.unblockAll
    }),
    "voiceCommandToggle": new ToggleEdit({
        "elementName": "voiceCommandToggle",
        "storageName": "VOICE_COMMAND_TOGGLE",
        "default": "false"
    }),
    "voiceCommandInfo": new ExternalField({
        "external": SpeechEngineManager?.Menu?.reloadMenu || alert("Menu failed to load!")
    }),
    "autoReconnectType": new FieldEdit({
        "storageName": "AUTO_RECONNECT_TYPE_FIELD",
        "prompt": "Enter where you want auto-reconnect to be enabled." +
            "\n\n1 = Text Chat" +
            "\n2 = Video Chat" +
            "\n3 = Both Chats",
        "default": "1",
        "check": (response) => {

            // Accept all no-values
            if (!["1", "2", "3"].includes(response)) {
                return {
                    "confirm": "false",
                    "value": response
                }
            }

            return {
                "confirm": "true",
                "value": response
            };
        }
    }),
    "homePageSplashToggle": new ToggleEdit({
        "elementName": "homePageSplashToggle",
        "storageName": "HOME_PAGE_SPLASH_TOGGLE",
        "default": "false"
    }),
    "homePageSplashEdit": new FieldEdit({
        "storageName": "HOME_PAGE_SPLASH_FIELD",
        "prompt": "Enter a new splash background image URL:",
        "default": "https://i.imgur.com/qa5Hkl9.jpeg",
        "check": (response) => {
            return {
                "confirm": isValidHttpsUrl(response) ? "true" : "false",
                "value": response
            }
        }
    }),
}
const ConfigManager = {

    initialize() {

        /**
         * Load Initial Values
         */
        {
            let storageQuery = {}

            // Load Values
            for (let key of Object.keys(config)) {
                storageQuery[key] = config[key].getDefault();
            }

            chrome.storage.sync.get(storageQuery, (result) => {
                MutableField.localValues = result;
                document.dispatchEvent(new CustomEvent("localStorageLoaded"));
            });


        }

        /**
         * Update Changed Values
         */
        document.addEventListener("storageSettingsUpdate", (event) => ConfigManager._storageSettingsUpdate(event));

        /**
         * Load Initial Values
         */
        {
            let storageQuery = {}

            // Load Values
            for (let key of Object.keys(config)) {
                storageQuery[config[key].getName()] = config[key].getDefault();
            }

            chrome.storage.sync.get(storageQuery, (result) => MutableField.localValues = result);

        }

        /**
         * Update Changed Values
         */
        document.addEventListener("storageSettingsUpdate", (event) => {
            for (let key of Object.keys(event.detail)) {
                MutableField.localValues[key] = event.detail[key];
            }
        });

    },

    _storageSettingsUpdate(event) {
        for (let key of Object.keys(event.detail)) {
            MutableField.localValues[key] = event.detail[key];
        }
    }

}

