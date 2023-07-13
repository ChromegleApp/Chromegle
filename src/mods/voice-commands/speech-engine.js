class SpeechEngine {

    #engineSupported;
    #engine;
    #wakeWords;
    #engineActive;
    #commandEventName;
    #intents;

    constructor(wakeWords, commandEventName, intents) {
        this.#wakeWords = wakeWords;
        this.#commandEventName = commandEventName;
        this.#engineSupported = this.#buildEngine();
        this.#intents = intents;
    }

    #buildEngine() {
        try {
            this.#engine = new (
                window["webkitSpeechRecognition"] ||
                window["speechRecognition"] ||
                window["SpeechRecognition"]
            );
        } catch (ex) {

        }

        if (!this.#engine) {
            return false;
        }

        this.#engine.continuous = true;
        this.#engine.interimResults = false;
        this.#engine.lang = "en-US";
        this.#engine.onstart = this.#onStart.bind(this);
        this.#engine.onend = this.#onEnd.bind(this);
        this.#engine.onresult = this.#onResult.bind(this);

        return true;

    }

    start() {

        if (!this.#engineSupported) {
            setTimeout(() => {
                alert("Voice Commands are NOT supported on your browser, please disable the setting or use a supported browser.")
                Logger.ERROR("This browser does NOT support the speech engine and Voice Commands should be disabled in Chromegle's settings.");
            }, 150);
            return;
        }

        if (!this.#engineActive) {
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(() => Logger.INFO("Microphone permission enabled, started Chromegle Speech Engine"))
                .catch(() => Logger.ERROR("Microphone permission rejected, Chromegle Speech Engine will not work"));
        }

        this.#engineActive = true;
        this.#engine.start();
    }

    stop() {
        if (!this.#engineSupported) {
            return;
        }

        Logger.INFO("Stopped Chromegle Speech Engine");
        this.#engineActive = false;
        this.#engine.stop();
    }

    isActive() {
        return this.#engineActive;
    }

    getWakeWords() {
        return this.#wakeWords;
    }

    #onStart() {
    }

    #onEnd() {
        if (this.isActive()) {
            this.start();
        }
    }

    #onResult(event, result = "", request = null) {

        // If not a result
        if (event.type !== "result") return;

        // Build result string
        for (let phrase of event.results[event.resultIndex]) {
            result += phrase.transcript;
        }

        // Lowercase it
        result = result.toLowerCase();

        // Parse message for command using wake word
        for (let testCase of this.getWakeWords()) {
            let indexOf = result.indexOf(testCase)
            if ((indexOf >= 0)) {
                request = result.substring(indexOf + testCase.length, result.length).trim();
                break;
            }
        }

        // No command found
        if (request == null || request.length < 1) {
            return;
        }

        // Dispatch command
        this.commandHandler(request);

    }


    commandHandler(utterance) {

        for (let intent of this.#intents) {
            if (intent.canHandle(utterance)) {
                Logger.INFO(`Executed the <%s> voice command intent handler`, intent.getName());
                intent.handle(utterance);
                return;
            }
        }

        Logger.DEBUG("Received a voice command that did not map to an intent <%s>", utterance);

    }
}

