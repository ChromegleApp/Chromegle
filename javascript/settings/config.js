
const config = {
    "greetingMessageField": new FieldEdit({
        "storageName": "GREETING_MESSAGE_FIELD",
        "prompt": "Enter a new message to display on join:",
        "default": "Hello there!",
        "check": (response) => {

            if (response == null) {
                return {
                    "confirm": "false",
                    "value": null
                };
            } else if (response.length < 1) {
                return {
                    "confirm": "false",
                    "value": null
                };
            } else {
                return {
                    "confirm": "true",
                    "value": response
                };

            }

        }
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
        "default": "false"
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
        "default": "false"
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
}

