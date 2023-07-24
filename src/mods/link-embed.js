class LinkEmbedManager extends Module {

    static linkClass = "embeddedChatLink";

    onPageStarted() {
        this.addEventListener("click", this.onElementClicked);
    }
    onElementClicked(event) {

        if (!event.target.classList.contains(LinkEmbedManager.linkClass)) {
            return;
        }

        if (!confirm(this.#getConfirmMessage(event.target))) {
            event.preventDefault();
        }

    }

    #getConfirmMessage(target) {
        return "Are you sure you want to visit " + (target?.href?.split("?")?.[0] || "this site") + "?";
    }

    onChatMessage(event) {

        /** @type ChatMessage */
        const message = event.detail;

        for (let textNode of message.getTextNodes()) {
            textNode.replaceWith(
                ...this.changeTextNode(textNode)
            )
        }

    }

    changeTextNode(node) {
        let testSpan = document.createElement("span");
        testSpan.innerHTML = node.nodeValue;

        for (let word of node.nodeValue.split(" ")) {
            let url = this.toURL(word);

            if (!Boolean(url)) {
                continue;
            }

            testSpan.innerHTML = testSpan.innerHTML.replace(
                this.toEntityVersion(word), EmbeddedLink(url.toString()).outerHTML
            );

        }

        return testSpan.childNodes;

    }

    toEntityVersion(word) {
        let el = document.createElement("span");
        el.innerHTML = word;
        return el.innerHTML
    }

    toURL(text) {

        if (!text.startsWith("http")) {
            return null;
        }

        try {
            return new URL(text);
        }
        catch(e) {
            return null;
        }

    }


}