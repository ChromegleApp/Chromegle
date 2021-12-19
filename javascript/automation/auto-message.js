// noinspection JSUnresolvedFunction

document.addEventListener("chatStarted", (detail) => {

    let greetingQuery = {};
    const uuid = detail["detail"]["uuid"];

    greetingQuery[config.toggleGreeting.getName()] = config.toggleGreeting.getDefault();
    greetingQuery[config.startTypingDelayField.getName()] = config.startTypingDelayField.getDefault();
    greetingQuery[config.greetingMessageField.getName()] = config.greetingMessageField.getDefault();
    greetingQuery[config.typingSpeedField.getName()] = config.typingSpeedField.getDefault();
    greetingQuery[config.sendDelayField.getName()] = config.sendDelayField.getDefault();

    chrome.storage.sync.get(greetingQuery, (result) => {

        if (result[config.toggleGreeting.getName()] === "true") {

            let textContent = result[config.greetingMessageField.getName()]
            let wpm = result[config.typingSpeedField.getName()]
            let startDelay = result[config.startTypingDelayField.getName()]
            let sendDelay = result[config.sendDelayField.getName()]

            setTimeout(() => {
                const totalTime = typingDelay(textContent, wpm);
                const timePerMessage = totalTime / textContent.length;

                writeMessage($(".chatmsg"), textContent, timePerMessage, sendDelay * 1000, uuid);
            }, startDelay * 1000);

        }
    })


});

const typingDelay = (text, wpm) => {
    return (60 / (wpm === null ? 0.1 : wpm)) * (text.length / 8) * 1000;
}

function writeMessage(writeBox, text, perLetterDelay, finalSendDelay, uuid) {

    if (uuid !== ChatRegistry.getUUID()) {
        return;
    }

    if (text.length === 0) {
        setTimeout(() => {
            $(".sendbtn").trigger("click");
        }, finalSendDelay);
        return;
    }

    setTimeout(function () {

        if (uuid !== ChatRegistry.getUUID()) {
            return;
        }

        if ($(writeBox).get(0).classList.contains("disabled")) {
            return;
        }

        let keydown = document.createEvent('KeyboardEvent');
        let keyup = document.createEvent('KeyboardEvent');

        keydown.initKeyboardEvent("keydown", true, true, undefined, false, false, false, false, text[0], text[0]);
        keyup.initKeyboardEvent("keyup", true, true, undefined, false, false, false, false, text[0], text[0]);

        writeBox.get(0).dispatchEvent(keydown);
        writeBox.get(0).dispatchEvent(keyup);
        writeBox.val(writeBox.val() + text[0]);

        writeMessage(writeBox, text.substring(1, text.length), perLetterDelay, finalSendDelay, uuid);

    }, perLetterDelay);

}




