let Settings;
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
        VideoBlockerManager,
        VideoScreenshotManager,
        IPBlockingManager,
        SpeechEngineManager,
        FullScreenVideoManager,
        SplashImageHandler,
        ClearInterestsManager,
        ThemeManager,
        SettingsManager,
    )

})();



