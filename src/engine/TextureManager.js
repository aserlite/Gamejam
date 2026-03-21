export class TextureManager {
    constructor() {
        this.textures = new Map();
        this.loadingPromises = new Map();
    }

    load(name, src) {
        if (this.textures.has(name)) {
            return Promise.resolve(this.textures.get(name));
        }

        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.textures.set(name, img);
                this.loadingPromises.delete(name);
                resolve(img);
            };
            img.onerror = (err) => {
                console.error(`Erreur de chargement de la texture '${name}' depuis ${src}`, err);
                this.loadingPromises.delete(name);
                reject(err);
            };
            img.src = src;
        });

        this.loadingPromises.set(name, promise);
        return promise;
    }

    loadAll(textureMap) {
        const promises = [];
        for (const [name, src] of Object.entries(textureMap)) {
            promises.push(this.load(name, src));
        }
        return Promise.all(promises);
    }

    getTexture(name) {
        return this.textures.get(name);
    }
}