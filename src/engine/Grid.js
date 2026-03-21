export const CHUNK_SIZE = 32;

class Chunk {
    constructor(chunkX, chunkY) {
        this.x = chunkX;
        this.y = chunkY;
        this.cells = new Map();
    }

    _getCellKey(localX, localY) {
        return `${localX},${localY}`;
    }

    setCell(localX, localY, data) {
        if (data === null || data === undefined) {
            this.cells.delete(this._getCellKey(localX, localY));
        } else {
            this.cells.set(this._getCellKey(localX, localY), data);
        }
    }

    getCell(localX, localY) {
        return this.cells.get(this._getCellKey(localX, localY));
    }
}

export class Grid {
    constructor() {
        this.chunks = new Map();
    }

    _getChunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    _getCoords(cellX, cellY) {
        const chunkX = Math.floor(cellX / CHUNK_SIZE);
        const chunkY = Math.floor(cellY / CHUNK_SIZE);
        const localX = ((cellX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const localY = ((cellY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        return { chunkX, chunkY, localX, localY };
    }

    _getOrCreateChunk(chunkX, chunkY) {
        const key = this._getChunkKey(chunkX, chunkY);
        if (!this.chunks.has(key)) {
            this.chunks.set(key, new Chunk(chunkX, chunkY));
        }
        return this.chunks.get(key);
    }

    setCell(cellX, cellY, data) {
        const { chunkX, chunkY, localX, localY } = this._getCoords(cellX, cellY);
        const chunk = this._getOrCreateChunk(chunkX, chunkY);
        chunk.setCell(localX, localY, data);
    }

    getCell(cellX, cellY) {
        const { chunkX, chunkY, localX, localY } = this._getCoords(cellX, cellY);
        const key = this._getChunkKey(chunkX, chunkY);
        if (!this.chunks.has(key)) {
            return undefined;
        }
        const chunk = this.chunks.get(key);
        return chunk.getCell(localX, localY);
    }
    
    getChunk(chunkX, chunkY) {
        return this.chunks.get(this._getChunkKey(chunkX, chunkY));
    }

    /**
     * Sérialise la grille entière (uniquement les chunks non vides) 
     * en un format JSON pour l'export/sauvegarde.
     */
    serialize() {
        const data = [];
        for (const [chunkKey, chunk] of this.chunks.entries()) {
            if (chunk.cells.size === 0) continue;

            const cellsArray = [];
            for (const [localKey, cellData] of chunk.cells.entries()) {
                cellsArray.push({
                    k: localKey,
                    d: cellData
                });
            }

            data.push({
                x: chunk.x,
                y: chunk.y,
                c: cellsArray
            });
        }
        return JSON.stringify(data);
    }

    /**
     * Restaure l'état de la grille à partir d'une chaîne JSON.
     */
    deserialize(jsonString) {
        this.chunks.clear();
        if (!jsonString) return;
        
        try {
            const data = JSON.parse(jsonString);
            for (const chunkData of data) {
                const chunk = new Chunk(chunkData.x, chunkData.y);
                for (const cell of chunkData.c) {
                    chunk.cells.set(cell.k, cell.d);
                }
                this.chunks.set(this._getChunkKey(chunk.x, chunk.y), chunk);
            }
        } catch (e) {
            console.error("Erreur lors de la désérialisation de la grille :", e);
        }
    }
}