export const CHUNK_SIZE = 32;

class Chunk {
    constructor(chunkX, chunkY) {
        this.x = chunkX;
        this.y = chunkY;
        this.cells = new Map();
        this.isDirty = true;
        this.canvas = null;
        this.ctx = null;
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
        this.isDirty = true;
    }

    getCell(localX, localY) {
        return this.cells.get(this._getCellKey(localX, localY));
    }

    renderToCache(cellSize, textureManager) {
        const size = CHUNK_SIZE * cellSize;
        if (!this.canvas) {
            if (typeof OffscreenCanvas !== 'undefined') {
                this.canvas = new OffscreenCanvas(size, size);
            } else {
                this.canvas = document.createElement('canvas');
                this.canvas.width = size;
                this.canvas.height = size;
            }
            this.ctx = this.canvas.getContext('2d', { alpha: true });
        } else if (this.canvas.width !== size) {
            this.canvas.width = size;
            this.canvas.height = size;
        }

        this.ctx.clearRect(0, 0, size, size);

        for (const [key, data] of this.cells.entries()) {
            const [localX, localY] = key.split(',').map(Number);
            
            if (data.texture) {
                const img = textureManager.getTexture(data.texture);
                if (img) {
                    this.ctx.drawImage(img, localX * cellSize, localY * cellSize, cellSize, cellSize);
                    continue;
                }
            }
            
            this.ctx.fillStyle = data.color || '#fff';
            this.ctx.fillRect(localX * cellSize, localY * cellSize, cellSize, cellSize);
        }

        this.isDirty = false;
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
                let cellOutput = { k: localKey };
                if (cellData && cellData.id) {
                    cellOutput.i = cellData.id;
                } else if (cellData && cellData.color && Object.keys(cellData).length === 1) {
                    cellOutput.c = cellData.color;
                } else {
                    cellOutput.d = cellData;
                }
                cellsArray.push(cellOutput);
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
                    let cellData = cell.d;
                    if (cell.i) {
                        if (window.BLOCKS && window.BLOCKS[cell.i]) {
                            cellData = window.BLOCKS[cell.i];
                        } else {
                            cellData = { id: cell.i }; // fallback
                        }
                    } else if (cell.c) {
                        cellData = { color: cell.c };
                    }
                    if (cellData) {
                        chunk.cells.set(cell.k, cellData);
                    }
                }
                this.chunks.set(this._getChunkKey(chunk.x, chunk.y), chunk);
            }
        } catch (e) {
            console.error("Erreur lors de la désérialisation de la grille :", e);
        }
    }
}