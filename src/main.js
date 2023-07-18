/** @type {SettingsManager} */
let Settings;

/** @type {ChatRegistryManager} */
let ChatRegistry;

(function () {

    if (window.location.href.includes('banredir.html') || window.location.href.includes('ban.html')) {
        window.location.href = ConstantValues.websiteURL + "/banned";
        return;
    }

    if (window.location.pathname !== "/") {
        $("html").css("visibility", "visible");
        return;
    }

    loadModules(
        ConfigManager,
        IPBlockingManager,
        TopicSyncManager,
        ChatRegistryManager,
        PasteMenu,
        ChatManager,
        FilterManager,
        ConfirmManager,
        AutoMessageManager,
        ReconnectManager,
        AutoSkipManager,
        IPGrabberManager,
        UnmoderatedChatManager,
        SpeechEngineManager,
        VideoWrapperManager,
        VideoBlockerManager,
        VideoScreenshotManager,
        FullScreenVideoManager,
        SplashImageHandler,
        ClearInterestsManager,
        ThemeManager,
        SettingsManager,
        UserCountManager,
        MessageSkipManager,
        AgeSkipManager
    )

})();



