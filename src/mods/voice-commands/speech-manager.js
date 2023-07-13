
class SpeechMenu {

    static settingsModalElementId = "modal-4";
    static enable = () => MicroModal.show(this.settingsModalElementId);
    static disable = () => MicroModal.hide(this.settingsModalElementId);

    constructor() {
        let modal = document.createElement("div");
        $(modal).load(getResourceURL("public/html/voicecmds.html"));
        $("html").append(modal);
    }

    reloadMenu(noChange) {

        if (noChange) {
            return;
        }

        Settings.disable();
        SpeechMenu.enable();
    }

}


class SpeechEngineManager extends Module {

    static Menu = new SpeechMenu();
    #engine = new SpeechEngine(
        ["omegle", "amigo", "omigo"],
        "speechEngineCommand",
        [
            new SkipIntentHandler(),
            new StopIntentHandler(),
            new StartIntentHandler(),
            new MessageIntentHandler()
        ]
    );

    onSettingsUpdate(event) {

        let voiceCommandEnabled = config.voiceCommandToggle.fromSettingsUpdateEvent(event);

        if (voiceCommandEnabled === "true" && ChatRegistry.pageStarted()) {
            this.#engine.start();
        }
        else if (voiceCommandEnabled === "false" && ChatRegistry.pageStarted()) {
            this.#engine.stop();
        }

    }

    async onPageStarted() {
        const voiceCommandEnabled = await config.voiceCommandToggle.retrieveValue();

        if (voiceCommandEnabled === "true") {
            this.#engine.start();
        }

    }

}
