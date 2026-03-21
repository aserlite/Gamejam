export class SandSimulation {
    constructor() {
        this.materials = {
            SAND: { name: 'Sable', color: '#e6c27a', type: 'SAND', density: 3 },
            WATER: { name: 'Eau', color: '#4da6ff', type: 'WATER', density: 1, spreadRate: 5 },
            STONE: { name: 'Pierre', color: '#888888', type: 'SOLID', density: Infinity },
            WOOD: { name: 'Bois', color: '#8b5a2b', type: 'WOOD', density: Infinity, flammability: 0.1, health: 100 },
            LAVA: { name: 'Lave', color: '#ff4500', type: 'LAVA', density: 2, spreadRate: 2, flowDelay: 3 },
            EMBER: { name: 'Feu', color: '#ff7800', type: 'EMBER', density: 1 },
            STEAM: { name: 'Vapeur', color: '#dddddd', type: 'GAS', density: -1, life: 100 },
            GUNPOWDER: { name: 'Poudre', color: '#444444', type: 'SAND', density: 2.5 },
            WATER_GEN: { name: 'Source Eau', color: '#0033cc', type: 'GENERATOR', generates: 'WATER', density: Infinity },
            LAVA_GEN: { name: 'Source Lave', color: '#681d00', type: 'GENERATOR', generates: 'LAVA', density: Infinity },
            SAND_GEN: { name: 'Source Sable', color: '#887549', type: 'GENERATOR', generates: 'SAND', density: Infinity },
            POWDER_GEN: { name: 'Source Poudre', color: '#222222', type: 'GENERATOR', generates: 'GUNPOWDER', density: Infinity },
            VOID: { name: 'Vide', color: '#1a1a1a', type: 'KILL', density: 0 }
        };

        this.paletteColors = [
            { color: this.materials.STONE.color, name: 'Pierre' },
            { color: this.materials.SAND.color, name: 'Sable' },
            { color: this.materials.WATER.color, name: 'Eau' },
            { color: this.materials.LAVA.color, name: 'Lave' },
            { color: this.materials.GUNPOWDER.color, name: 'Poudre' },
            { color: this.materials.WOOD.color, name: 'Bois' },
            { color: this.materials.SAND_GEN.color, name: 'Source Sable' },
            { color: this.materials.WATER_GEN.color, name: 'Source Eau' },
            { color: this.materials.LAVA_GEN.color, name: 'Source Lave' },
            { color: this.materials.POWDER_GEN.color, name: 'Source Poudre' },
            { color: this.materials.STEAM.color, name: 'Vapeur' },
            { color: this.materials.VOID.color, name: 'Vide' },
            null
        ];
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', 'Falling Sand Physics');
        engine.debugDisplay.setCustomData('Déplacement', 'Shift + Clic Gauche (Pinceau)');
        engine.debugDisplay.setCustomData('Palette', 'Touche C');

        engine.timeControl.setTPS(60);

        engine.colorPalette.colors = this.paletteColors;
        engine.colorPalette.selectedColor = this.paletteColors[0];

        if (!dataLoaded) {
            for (let x = -20; x <= 20; x++) {
                engine.grid.setCell(x, 10, { ...this.materials.STONE });
            }
            for (let y = -20; y <= 10; y++) {
                engine.grid.setCell(-20, y, { ...this.materials.STONE });
                engine.grid.setCell(20, y, { ...this.materials.STONE });
            }
            for (let x = -200; x <= 200; x++) {
                engine.grid.setCell(x, 100, { ...this.materials.VOID });
            }
        }
    }

    getMaterialFromColor(colorObj) {
        if (!colorObj) return null;
        const colorHex = typeof colorObj === 'string' ? colorObj : colorObj.color;

        for (const mat of Object.values(this.materials)) {
            if (mat.color === colorHex) return mat;
        }
        return { name: 'Sable', color: colorHex, type: 'SAND', density: 3 };
    }

    handleInputs(engine) {
        const { inputManager, camera, grid, cellSize, colorPalette } = engine;
        const { mouseState } = inputManager;

        const selectedToolName = colorPalette.selectedColor ? colorPalette.getColorName(colorPalette.selectedColor) : 'Gomme';
        engine.debugDisplay.setCustomData('Outil', selectedToolName);

        if (mouseState.isDown && mouseState.isEditing) {
            const worldPos = camera.screenToWorld(mouseState.screenX, mouseState.screenY);
            const centerX = Math.floor(worldPos.x / cellSize);
            const centerY = Math.floor(worldPos.y / cellSize);

            const brushSize = 2;
            const material = this.getMaterialFromColor(colorPalette.selectedColor);

            for (let dx = -brushSize; dx <= brushSize; dx++) {
                for (let dy = -brushSize; dy <= brushSize; dy++) {
                    if (dx*dx + dy*dy <= brushSize*brushSize) {
                        if (colorPalette.selectedColor === null) {
                            grid.setCell(centerX + dx, centerY + dy, null);
                        } else if (!grid.getCell(centerX + dx, centerY + dy)) {
                            const chance = (material.type === 'SOLID' || material.type === 'WOOD') ? 1.0 : 0.3;
                            if (Math.random() <= chance) {
                                grid.setCell(centerX + dx, centerY + dy, { ...material, tickCounter: 0 });
                            }
                        }
                    }
                }
            }
        }
    }

    triggerExplosion(centerX, centerY, radius, engine, updatedCells) {
        for (let ex = -radius; ex <= radius; ex++) {
            for (let ey = -radius; ey <= radius; ey++) {
                if (ex * ex + ey * ey <= radius * radius) {
                    const targetX = centerX + ex;
                    const targetY = centerY + ey;
                    const c = engine.grid.getCell(targetX, targetY);

                    if (!c || (c.type !== 'KILL' && c.type !== 'GENERATOR')) {
                        const rand = Math.random();

                        if (rand < 0.15) {
                            engine.grid.setCell(targetX, targetY, { ...this.materials.EMBER, health: 20 + Math.random() * 30 });
                        } else if (rand < 0.4) {
                            engine.grid.setCell(targetX, targetY, { ...this.materials.STEAM, life: 60 + Math.random() * 40 });
                        } else {
                            engine.grid.setCell(targetX, targetY, null);
                        }

                        updatedCells.add(`${targetX},${targetY}`);
                    }
                }
            }
        }
    }

    onTick(dt, engine) {
        const cellsToUpdate = [];
        const updatedCells = new Set();

        for (const chunk of engine.grid.chunks.values()) {
            for (const [localKey, data] of chunk.cells.entries()) {
                if (data.type !== 'SOLID' && data.type !== 'KILL') {
                    const [localX, localY] = localKey.split(',').map(Number);
                    cellsToUpdate.push({
                        x: chunk.x * 32 + localX,
                        y: chunk.y * 32 + localY,
                        data: data
                    });
                }
            }
        }

        cellsToUpdate.sort((a, b) => {
            if (a.y !== b.y) {
                const isGasA = a.data.type === 'GAS';
                const isGasB = b.data.type === 'GAS';
                if (isGasA && !isGasB) return -1;
                if (!isGasA && isGasB) return 1;
                if (isGasA && isGasB) return a.y - b.y;
                return b.y - a.y;
            }
            return Math.random() - 0.5;
        });

        for (const cell of cellsToUpdate) {
            if (updatedCells.has(`${cell.x},${cell.y}`)) continue;
            const { x, y, data } = cell;

            const swap = (nx, ny) => {
                const targetData = engine.grid.getCell(nx, ny);
                if (targetData && targetData.type === 'KILL') {
                    engine.grid.setCell(x, y, null);
                    updatedCells.add(`${x},${y}`);
                    return;
                }
                updatedCells.add(`${nx},${ny}`);
                engine.grid.setCell(nx, ny, data);
                engine.grid.setCell(x, y, targetData);
                cell.x = nx;
                cell.y = ny;
            };

            const canDisplace = (targetData, sourceData) => {
                if (!targetData) return true;
                if (targetData.type === 'SOLID' || targetData.type === 'WOOD') return false;

                if (sourceData.type === 'GAS') {
                    return targetData.density < sourceData.density;
                }
                return targetData.density < sourceData.density;
            };

            if (data.type === 'GAS') {
                data.life = (data.life || 100) - 1;
                if (data.life <= 0) {
                    engine.grid.setCell(x, y, null);
                    continue;
                }

                const up = engine.grid.getCell(x, y - 1);
                if (canDisplace(up, data)) {
                    swap(x, y - 1);
                } else {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const upLeft = engine.grid.getCell(x - dir, y - 1);
                    const upRight = engine.grid.getCell(x + dir, y - 1);
                    if (canDisplace(upLeft, data)) {
                        swap(x - dir, y - 1);
                    } else if (canDisplace(upRight, data)) {
                        swap(x + dir, y - 1);
                    } else {
                        const side = engine.grid.getCell(x + dir, y);
                        if(canDisplace(side, data)) {
                            swap(x + dir, y);
                        }
                    }
                }
                continue;
            }

            if (data.type === 'EMBER') {
                data.health = (data.health || 100) - 1;
                if (data.health <= 0) {
                    engine.grid.setCell(x, y, null);
                    continue;
                }
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const neighbor = engine.grid.getCell(x + dx, y + dy);
                        if (!neighbor) continue;

                        if (neighbor.type === 'WOOD' && Math.random() < neighbor.flammability) {
                            neighbor.type = 'EMBER';
                            neighbor.color = this.materials.EMBER.color;
                            neighbor.health = this.materials.WOOD.health;
                        }

                        if (neighbor.type === 'SAND' && neighbor.color === this.materials.GUNPOWDER.color) {
                            this.triggerExplosion(x + dx, y + dy, 6, engine, updatedCells);
                            break;
                        }
                    }
                }
            }

            let interacted = false;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const neighbor = engine.grid.getCell(x + dx, y + dy);
                    if (!neighbor) continue;

                    if (data.type === 'LAVA') {
                        if (neighbor.type === 'WATER') {
                            engine.grid.setCell(x, y, { ...this.materials.STONE });
                            engine.grid.setCell(x + dx, y + dy, { ...this.materials.STEAM });
                            interacted = true; break;
                        }
                        if (neighbor.type === 'WOOD' && Math.random() < 0.5) {
                            neighbor.type = 'EMBER';
                            neighbor.color = this.materials.EMBER.color;
                            neighbor.health = this.materials.WOOD.health;
                        }
                        if (neighbor.type === 'SAND' && neighbor.color === this.materials.GUNPOWDER.color) {
                            this.triggerExplosion(x + dx, y + dy, 6, engine, updatedCells);
                            interacted = true;
                            break;
                        }
                    }
                }
                if (interacted) break;
            }
            if (interacted) continue;


            if (data.type === 'SAND') {
                const down = engine.grid.getCell(x, y + 1);
                if (canDisplace(down, data)) { swap(x, y + 1); }
                else {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const dLeft = engine.grid.getCell(x - dir, y + 1);
                    const dRight = engine.grid.getCell(x + dir, y + 1);
                    if (canDisplace(dLeft, data)) { swap(x - dir, y + 1); }
                    else if (canDisplace(dRight, data)) { swap(x + dir, y + 1); }
                }
            }
            else if (data.type === 'GENERATOR') {
                const down = engine.grid.getCell(x, y + 1);

                if (!down) {
                    const materialToSpawn = this.materials[data.generates];
                    engine.grid.setCell(x, y + 1, { ...materialToSpawn, tickCounter: 0 });
                    updatedCells.add(`${x},${y + 1}`);
                }
                continue;
            }
            else if (data.type === 'WATER' || data.type === 'LAVA') {
                if (data.type === 'LAVA') {
                    data.tickCounter = (data.tickCounter || 0) + 1;
                    if (data.tickCounter % data.flowDelay !== 0) continue;
                }

                const down = engine.grid.getCell(x, y + 1);
                if (canDisplace(down, data)) {
                    swap(x, y + 1);
                } else {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const dSide1 = engine.grid.getCell(x - dir, y + 1);
                    const dSide2 = engine.grid.getCell(x + dir, y + 1);

                    if (canDisplace(dSide1, data)) { swap(x - dir, y + 1); }
                    else if (canDisplace(dSide2, data)) { swap(x + dir, y + 1); }
                    else {
                        let moved = false;
                        for (let i = 1; i <= data.spreadRate; i++) {
                            const nextCell = engine.grid.getCell(x + dir * i, y);
                            if (canDisplace(nextCell, data)) {
                                swap(x + dir * i, y);
                                moved = true;
                                break;
                            } else {
                                break;
                            }
                        }
                        if (!moved) {
                            for (let i = 1; i <= data.spreadRate; i++) {
                                const nextCell = engine.grid.getCell(x - dir * i, y);
                                if (canDisplace(nextCell, data)) {
                                    swap(x - dir * i, y);
                                    break;
                                } else {
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    onRender(ctx, camera) {
    }
}