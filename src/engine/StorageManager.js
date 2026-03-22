export class StorageManager {
    constructor(engine) {
        this.engine = engine;
        this.autoSaveInterval = 5000;
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
            console.error("[StorageManager] Erreur lors de la sauvegarde locale (quota dépassé ?)", e);
            console.log("[StorageManager] Tentative de nettoyage du localStorage pour libérer de l'espace...");
            
            const keys = Object.keys(localStorage);
            for (const k of keys) {
                if (k !== key && k !== 'islandCrafter_player' && k !== 'islandCrafter_playedIntro') {
                    localStorage.removeItem(k);
                }
            }
            
            try {
                localStorage.setItem(key, data);
                console.log("[StorageManager] Sauvegarde réussie après nettoyage !");
                this.engine.debugDisplay.setCustomData('Auto-Save', 'Nettoyage ✔');
                setTimeout(() => this.engine.debugDisplay.removeCustomData('Auto-Save'), 1500);
            } catch (e2) {
                console.error("[StorageManager] Echec critique de la sauvegarde par manque d'espace.", e2);
                this.engine.debugDisplay.setCustomData('Auto-Save', 'Erreur Stockage!');
            }
        }
    }

    load() {
        const key = this.getStorageKey();
        if (!key) {
            console.log("[StorageManager] No storage key found.");
            return false;
        }

        const data = localStorage.getItem(key);
        console.log(`[StorageManager] load() from key '${key}': ${data ? data.length : 0} bytes found.`);
        if (data) {
            try {
                this.engine.grid.deserialize(data);
                console.log(`[StorageManager] Deserialization complete. Chunks count: ${this.engine.grid.chunks.size}`);
                if (this.engine.grid.chunks.size === 0) {
                    console.warn("[StorageManager] Deserialized map is empty! Returning false to force new generation.");
                    return false;
                }
                return true;
            } catch (e) {
                console.error("[StorageManager] Erreur lors du chargement de la sauvegarde locale", e);
                return false;
            }
        }
        return false;
    }

    update(time) {
        if (time - this.lastSaveTime > this.autoSaveInterval) {
            if (this.engine.grid.chunks.size > 0) {
                this.save();
            }
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
