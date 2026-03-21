export class StorageManager {
    constructor(engine) {
        this.engine = engine;
        this.autoSaveInterval = 5000; // 5 secondes
        this.lastSaveTime = 0;
        this.storageKeyPrefix = 'pixelweaver_save_';
    }

    getStorageKey() {
        if (!this.engine.projectName) return null;
        return `${this.storageKeyPrefix}${this.engine.projectName}`;
    }

    save() {
        const key = this.getStorageKey();
        if (!key) return;

        const data = this.engine.grid.serialize();
        if (data === "[]") {
            localStorage.removeItem(key);
            return;
        }

        try {
            localStorage.setItem(key, data);
            
            this.engine.debugDisplay.setCustomData('Auto-Save', '✔');
            setTimeout(() => this.engine.debugDisplay.removeCustomData('Auto-Save'), 1000);
            
        } catch (e) {
            console.error("Erreur lors de la sauvegarde locale (quota dépassé ?)", e);
        }
    }

    load() {
        const key = this.getStorageKey();
        if (!key) return false;

        const data = localStorage.getItem(key);
        if (data) {
            try {
                this.engine.grid.deserialize(data);
                return true;
            } catch (e) {
                console.error("Erreur lors du chargement de la sauvegarde locale", e);
                return false;
            }
        }
        return false;
    }

    update(time) {
        if (time - this.lastSaveTime > this.autoSaveInterval) {
            this.save();
            this.lastSaveTime = time;
        }
    }

    clear() {
        const key = this.getStorageKey();
        if (key) {
            localStorage.removeItem(key);
        }
    }
}
