/** @type {SettingsManager} */
let Settings;

/** @type {ChatRegistryManager} */
let ChatRegistry;

/** @type {Object} */
let Manifest;

(function () {

    if (window.location.href.includes('banredir.html') || window.location.href.includes('ban.html')) {
        window.location.href = ConstantValues.websiteURL + "/banned";
        return;
    }

    if (window.location.pathname !== "/") {
        $("html").css("visibility", "visible");
        return;
    }

    runDataLoaders(
        ManifestLoader,
        TipsLoader,
        VideoPopoutStyleLoader
    )

    loadModules(
        IPBlockingManager,
        ThemeManager,
        TopicSyncManager,
        ChatRegistryManager,
        PasteMenu,
        ChatManager,
        FilterManager,
        ConfirmManager,
        AutoMessageManager,
        ReconnectManager,
        IPGrabberManager,
        UnmoderatedChatManager,
        SpeechEngineManager,
        VideoWrapperManager,
        VideoBlockerManager,
        VideoScreenshotManager,
        FullScreenVideoManager,
        SplashImageHandler,
        ClearInterestsManager,
        SettingsManager,
        TimerSkipManager,
        RepeatSkipManager,
        MessageSkipManager,
        AgeSkipManager,
        UserCountManager,
        BroadcastManager,
        VideoPopoutManager,
        LinkEmbedManager
    );

})();



