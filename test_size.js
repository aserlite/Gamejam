import { SimplexNoise } from './src/AnimoTraversent/SimplexNoise.js';

class Chunk {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.cells = new Map();
    }
}

class MockGrid {
    constructor() {
        this.chunks = new Map();
        this.CHUNK_SIZE = 32;
    }
    
    _getCoords(cellX, cellY) {
        const chunkX = Math.floor(cellX / this.CHUNK_SIZE);
        const chunkY = Math.floor(cellY / this.CHUNK_SIZE);
        const localX = ((cellX % this.CHUNK_SIZE) + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        const localY = ((cellY % this.CHUNK_SIZE) + this.CHUNK_SIZE) % this.CHUNK_SIZE;
        return { chunkX, chunkY, localX, localY };
    }

    setCell(cellX, cellY, data) {
        const { chunkX, chunkY, localX, localY } = this._getCoords(cellX, cellY);
        const key = `${chunkX},${chunkY}`;
        if (!this.chunks.has(key)) {
            this.chunks.set(key, new Chunk(chunkX, chunkY));
        }
        const chunk = this.chunks.get(key);
        chunk.cells.set(`${localX},${localY}`, data);
    }
    
    serialize() {
        const data = [];
        for (const chunk of this.chunks.values()) {
            if (chunk.cells.size === 0) continue;
            const cellsArray = [];
            for (const [localKey, cellData] of chunk.cells.entries()) {
                let cellOutput = { k: localKey };
                if (cellData && cellData.id) cellOutput.i = cellData.id;
                else if (cellData && cellData.color) cellOutput.c = cellData.color;
                else cellOutput.d = cellData;
                cellsArray.push(cellOutput);
            }
            data.push({ x: chunk.x, y: chunk.y, c: cellsArray });
        }
        return JSON.stringify(data);
    }
}

const mockEngine = { grid: new MockGrid() };
const BLOCKS = { abyss: { id: 'abyss' }, deep_water: { id: 'deep_water' }, water: { id: 'water' }, sand: { id: 'sand' }, rock: { id: 'rock' }, grass: { id: 'grass' }, tree: { id: 'tree' } };

function generateIsland(engine) {
    const simplex = new SimplexNoise(Date.now() / 1000);
    const size = 75;
    const scale = 0.03;
    let cellsCount = 0;

    for (let x = -size; x <= size; x++) {
        for (let y = -size; y <= size; y++) {
            const normalizedDist = Math.sqrt(x * x + y * y) / size;
            const safeSpawnMask = Math.max(0, 1.2 - (normalizedDist * 2.5));
            const archipelagoMask = -Math.pow(normalizedDist, 3) * 1.5;
            const continentShape = safeSpawnMask + archipelagoMask;
            
            const noise1 = simplex.noise2D(x * scale, y * scale) * 0.70;
            const noise2 = simplex.noise2D(x * scale * 2.5, y * scale * 2.5) * 0.20;
            const noise3 = simplex.noise2D(x * scale * 5.0, y * scale * 5.0) * 0.10;
            const elevation = noise1 + noise2 + noise3 + continentShape;
            
            let blockData = null;
            if (elevation < -0.8) blockData = BLOCKS.abyss;
            else if (elevation < -0.3) blockData = BLOCKS.deep_water;
            else if (elevation < 0.0) blockData = BLOCKS.water;
            else if (elevation < 0.15) {
                blockData = BLOCKS.sand;
                if (Math.random() < 0.03 && normalizedDist > 0.05) blockData = BLOCKS.rock;
            } else {
                blockData = BLOCKS.grass;
                if (Math.random() < 0.08 && normalizedDist > 0.05) blockData = BLOCKS.tree;
            }
            engine.grid.setCell(x, y, blockData);
            cellsCount++;
        }
    }
    return cellsCount;
}

const count = generateIsland(mockEngine);
const serialized = mockEngine.grid.serialize();
console.log("Cells generated:", count);
console.log("String size (bytes):", Buffer.byteLength(serialized, 'utf8'));
