

class Module {

    eventListeners = [];
    elementListeners = [];
    registry = ChatRegistry;
    statics = ConstantValues;

    static initialize() {
        return new this();
    }

    addEventListener(type, listener, options = undefined, origin = undefined) {
        (origin || document).addEventListener(type, listener.bind(this), options);
        this.eventListeners.push(listener);
    }

    addMultiEventListener(listener, options, ...types) {
        for (let type of types) {
            this.addEventListener(type, listener, options);
        }
    }

    addElementListener(query, event, listener) {
        $(query).on(event, listener.bind(this));
        this.elementListeners.push(listener);
    }

    addMultiElementListener(event, listener, ...queries) {
        for (let query of queries){
            this.addElementListener(query, event, listener);
        }
    }

}
