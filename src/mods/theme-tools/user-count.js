class UserCountManager extends Module {

    #button;
    #interval;
    #intervalInt = 60 * 3 * 1000;
    #lastCount = 0;

    constructor() {
        super();
        setTimeout(this.setupCount.bind(this), 500);
    }

    setupCount() {
        this.#button = this.createUserCountButton().get(0);

        this.getUserCount().then(count => {
            $("#menucontainer").get(0).appendChild(this.#button);
            this.setUserCount(count);
        });

        // Update every
        this.#interval = setInterval(() => {
            this.getUserCount().then(count => {
                this.setUserCount(count);
            })
        }, this.#intervalInt);

    }

    setUserCount(count) {

        count = count || 0;
        let counter = document.getElementById("userCountNum");
        this.animateCounter(counter, this.#lastCount, count);
        this.#lastCount = count;
    }

    animateCounter(counter, oldCount, newCount) {
        let dataValue = oldCount;

        // If switching to/from zero, skip the old count
        if (oldCount === 0 || newCount === 0) {
            dataValue = newCount;
        }

        // Subtracting or adding?
        let operation = newCount > oldCount ? 1 : -1;
        counter.innerText = dataValue; // Stop flashing

        // Run animation
        let interval = setInterval(() => {
            counter.innerText = dataValue;

            if (dataValue === newCount) {
                clearInterval(interval);
            }

            dataValue += (1 * operation);
        }, 100);

    }

    createUserCountButton() {

        return $(`
                <div id="chromegleUserCount" class="noselect">
                    <span id="userCountNum" class="userCountNum"></span>
                    <span class="userCountDesc">Online Chromeglers</span>
                </div>
        `);

    }

    async getUserCount() {
        try {
            let result = await fetch(ConstantValues.apiURL + "users");
            let json = await result.json();
            return json['count'];
        } catch (ex) {
            return null;
        }
    }

}
