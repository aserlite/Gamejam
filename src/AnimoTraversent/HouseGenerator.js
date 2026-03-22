import { BLOCKS } from './BlockDictionary.js';

export function generateHouseRegion(engine, centerX, centerY, radius = 3) {
    const pad = radius + 6;
    
    for (let x = -pad - 12; x <= pad + 12; x++) {
        for (let y = -pad - 12; y <= pad + 12; y++) {
            engine.grid.setCell(centerX + x, centerY + y, BLOCKS.abyss);
        }
    }

    for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {
            const worldX = centerX + x;
            const worldY = centerY + y;
            
            if (x === -radius || x === radius || y === -radius || y === radius) {
                engine.grid.setCell(worldX, worldY, BLOCKS.house_wall);
            } else {
                engine.grid.setCell(worldX, worldY, BLOCKS.plank_floor);
            }
        }
    }

    engine.grid.setCell(centerX, centerY + radius, BLOCKS.house_exit);
}
