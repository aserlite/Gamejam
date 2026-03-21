import { SimplexNoise } from './SimplexNoise.js';
import { BLOCKS } from './BlockDictionary.js';

export function generateIsland(engine) {
    engine.grid.chunks.clear();

    const simplex = new SimplexNoise(Date.now() / 1000);
    const size = 75;
    const scale = 0.03;

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

            if (elevation < -0.8) {
                blockData = BLOCKS.abyss;
            } else if (elevation < -0.3) {
                blockData = BLOCKS.deep_water;
            } else if (elevation < 0.0) {
                blockData = BLOCKS.water;
            } else if (elevation < 0.15) {
                blockData = BLOCKS.sand;
                if (Math.random() < 0.03 && normalizedDist > 0.05) {
                    blockData = BLOCKS.rock;
                }
            } else {
                blockData = BLOCKS.grass;
                if (Math.random() < 0.08 && normalizedDist > 0.05) {
                    blockData = BLOCKS.tree;
                }
            }

            engine.grid.setCell(x, y, blockData);
        }
    }
}
