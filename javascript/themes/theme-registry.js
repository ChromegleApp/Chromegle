document.addEventListener("storageSettingsUpdate", (event) => {
    const keys = Object.keys(event["detail"]);

    // Theme Update
    if (keys.includes(config.semiLightModeOption.getName())) {
        const newThemeName = event["detail"][config.semiLightModeOption.getName()]
        const themeOption = config[newThemeName].getValue();

        themeManager.setCurrentResourcePath(themeOption);
        themeManager.loadCurrentTheme(false);
    }

    // Header Button Update
    if (keys.includes(config.headerButtonsToggle.getName())) {
        themeManager.toggleHeaderButton(event["detail"][config.headerButtonsToggle.getName()] === "true")
    }

})

