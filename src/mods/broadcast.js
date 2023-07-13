class Broadcast extends Module {

    CHECK_INTERVAL = 120 * 1000;
    EXECUTE_INTERVAL = 5 * 1000;
    ANIMATION_LENGTH = 5 * 1000;
    MAX_CHATS = 32;

    constructor() {
        super();
        this.recentChatIds = [];
        this.broadcasts = [];
        this.registerIntervals();
    }

    onChatStarted() {
        this.recentChatIds.unshift(this.registry.chatUUID);
        this.recentChatIds = this.recentChatIds.slice(0, this.MAX_CHATS);

        $(".logwrapper").append(`
            <div id="broadcast-id">Chat ID: ${this.registry.chatUUID.toUpperCase()}</div>
        `);
    }

    registerIntervals() {
        setInterval(this.checkBroadcasts, this.CHECK_INTERVAL);
        setInterval(this.executeBroadcast, this.EXECUTE_INTERVAL);
    }

    checkBroadcasts() {
        fetch(this.statics.apiURL + "broadcast", {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({chats: this.recentChatIds})
        })
            .then(res => res.json())
            .then(res => {
                this.broadcasts = [...this.broadcasts, ...res.broadcasts];
            });
    }

    executeBroadcast() {

        let broadcast = this.broadcasts.shift();
        if (broadcast == null) {
            return;
        }

        // todo print it

        // todo remove it
        setInterval(() => $(".broadcast").remove(), this.ANIMATION_LENGTH);
    }

}

