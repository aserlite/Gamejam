import { SimplexNoise } from './SimplexNoise.js';
import { BLOCKS } from './BlockDictionary.js';

export function generateIsland(engine) {
    engine.grid.chunks.clear();

    const simplex = new SimplexNoise(Date.now() / 1000);
    const size = 75;
    const scale = 0.03;

    for (let x = -size; x <= size; x++) {
        for (let y = -size; y <= size; y++) {
            
            // Distance normalisée (0 au centre, 1 sur les bords)
            const normalizedDist = Math.sqrt(x * x + y * y) / size;
            
            // 1. Un vaste plateau central au lieu d'une fine flèche
            const safeSpawnMask = Math.max(0, 1.2 - (normalizedDist * 2.5));
            
            // 2. Chute douce très éloignée pour garder la carte connectée longtemps
            const archipelagoMask = -Math.pow(normalizedDist, 3) * 1.5;
            
            const continentShape = safeSpawnMask + archipelagoMask;
            
            // 3. Modèle de Bruit Fractal (Lisser les hautes fréquences pour éviter les îles minuscules)
            const noise1 = simplex.noise2D(x * scale, y * scale) * 0.70;         // Pèse lourdement sur la formation d'un unique bloc
            const noise2 = simplex.noise2D(x * scale * 2.5, y * scale * 2.5) * 0.20; // Dessine quelques rivières intérieures
            const noise3 = simplex.noise2D(x * scale * 5.0, y * scale * 5.0) * 0.10; // Côtes peu hachées

            // Élévation finale
            const elevation = noise1 + noise2 + noise3 + continentShape;

            let blockData = null;

            // Nouveaux seuils : l'abysse bloque les ponts, l'eau profonde les autorise
            if (elevation < -0.8) {
                blockData = BLOCKS.abyss;
            } else if (elevation < -0.3) {
                blockData = BLOCKS.deep_water;
            } else if (elevation < 0.0) {
                blockData = BLOCKS.water; // L'eau peu profonde gagne plus de place (rivières/lacs)
            } else if (elevation < 0.15) {
                blockData = BLOCKS.sand; // Belles plages de sable plus épaisses
            } else {
                blockData = BLOCKS.grass;
            }

            engine.grid.setCell(x, y, blockData);
        }
    }
}
