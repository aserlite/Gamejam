import { BLOCKS } from './BlockDictionary.js';

export function generateHouseRegion(engine, centerX, centerY) {
    if (engine.grid.getCell(centerX, centerY)) return;

    const radius = 7;
    
    for (let x = -radius - 12; x <= radius + 12; x++) {
        for (let y = -radius - 12; y <= radius + 12; y++) {
            if (x < -radius || x > radius || y < -radius || y > radius) {
                engine.grid.setCell(centerX + x, centerY + y, BLOCKS.abyss);
            }
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

    engine.grid.setCell(centerX, centerY + radius - 1, BLOCKS.house_exit);
}
