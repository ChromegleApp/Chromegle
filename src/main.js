let Settings = null;

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
        ChatRegistry,
        PasteMenu,
        ChatManager,
        FilterManager,
        ConfirmManager,
        GreetingManager,
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
        SettingsManager
    )

})();



