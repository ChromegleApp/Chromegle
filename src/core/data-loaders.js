class DataLoader {

    async fetchJSON(url) {
        return (await fetch(url)).json();
    }

    async run() {}

}

class ManifestLoader extends DataLoader {

    async run() {
        Manifest = await this.fetchJSON(getResourceURL("manifest.json"));
    }

}

class TipsLoader extends DataLoader {

    async run() {
        ConstantValues._helpfulTips = await this.fetchJSON(ConstantValues.apiURL + "tips" + `?v=${Manifest.version}`);
    }

}

