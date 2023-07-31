class BaseModule {

    eventListeners = [];
    elementListeners = [];

    addEventListener(type, listener, options = undefined, origin = undefined) {

        (origin || document).addEventListener(type, listener.bind(this), options);

        // Prevent duplicates
        if (!this.eventListeners.includes(listener)) {
            this.eventListeners.push(listener);
        }

    }

    addMultiEventListener(listener, options, ...types) {
        for (let type of types) {
            this.addEventListener(type, listener, options);
        }
    }

    addElementListener(query, event, listener) {
        $(query).on(event, listener.bind(this));
        this.elementListeners.push(listener);
    }

    addMultiElementListener(event, listener, ...queries) {
        for (let query of queries){
            this.addElementListener(query, event, listener);
        }
    }

}


class Module extends BaseModule {

    registry = ChatRegistry;
    statics = ConstantValues;
    settings = Settings;

    /** Whether the module is supported on mobile */
    static mobileSupported = true;

    events = {
        "chatStarted": "onChatStarted",
        "chatEnded": "onChatEnded",
        "pageStarted": "onPageStarted",
        "storageSettingsUpdate": "onSettingsUpdate",
        "chatFailedConnect": "onChatFailedConnect",
        "videoChatLoaded": "onVideoLoaded",
        "wrappedVideos": "onWrappedVideos",
        "chatMessage": "onChatMessage",
        "chatSeenTimes": "onChatSeenTimes"
    }

    constructor() {
        super();
        this.registerListeners();
    }

    static initialize() {

        if (isMobile() && !this.mobileSupported) {
            return null;
        }

        return new this();
    }

    registerListeners() {

        for (const [key, value] of Object.entries(this.events)) {

            if (typeof this[value] === "function") {
                this.addEventListener(key, this[value]);
            }
        }

    }

    async retrieveChromeValue(key, defaultValue = null, storageArea = "sync") {
        let query = {[key]: defaultValue};
        return (await chrome.storage[storageArea].get(query))[key]
    }

}
