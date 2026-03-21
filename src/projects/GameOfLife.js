export class GameOfLife {
    constructor() {
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', 'Game of Life');
        engine.debugDisplay.setCustomData('Déplacement', 'Shift + Clic Gauche');
        engine.debugDisplay.setCustomData('Palette', 'Touche C');
        
        engine.timeControl.setTPS(10);

        engine.colorPalette.colors = [
            { color: '#ffffff', name: 'Cellule' },
            null // Gomme
        ];
        engine.colorPalette.selectedColor = engine.colorPalette.colors[0];
        
        if (!dataLoaded) {
            const startX = 0;
            const startY = 0;
            
            engine.grid.setCell(startX, startY - 1, { color: '#ffffff' });
            engine.grid.setCell(startX + 1, startY, { color: '#ffffff' });
            engine.grid.setCell(startX - 1, startY + 1, { color: '#ffffff' });
            engine.grid.setCell(startX, startY + 1, { color: '#ffffff' });
            engine.grid.setCell(startX + 1, startY + 1, { color: '#ffffff' });
        }
    }

    handleInputs(engine) {
        const { inputManager, camera, grid, cellSize, colorPalette } = engine;
        const { mouseState } = inputManager;

        const selectedToolName = colorPalette.selectedColor ? colorPalette.getColorName(colorPalette.selectedColor) : 'Gomme';
        engine.debugDisplay.setCustomData('Outil', selectedToolName);

        if (mouseState.isDown && mouseState.isEditing) {
            const worldPos = camera.screenToWorld(mouseState.screenX, mouseState.screenY);
            const cellX = Math.floor(worldPos.x / cellSize);
            const cellY = Math.floor(worldPos.y / cellSize);
            
            if (colorPalette.selectedColor === null) {
                grid.setCell(cellX, cellY, null);
            } else {
                grid.setCell(cellX, cellY, { color: colorPalette.getColorValue(colorPalette.selectedColor) });
            }
        }
    }

    onTick(dt, engine) {
        const { grid } = engine;

        const cellsToCheck = new Set();
        const aliveCells = [];
        
        for (const chunk of grid.chunks.values()) {
            for (const [localKey, data] of chunk.cells.entries()) {
                const [localX, localY] = localKey.split(',').map(Number);
                const cellX = chunk.x * 32 + localX;
                const cellY = chunk.y * 32 + localY;
                
                aliveCells.push({x: cellX, y: cellY, color: data.color});
                
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        cellsToCheck.add(`${cellX + dx},${cellY + dy}`);
                    }
                }
            }
        }

        const nextGeneration = [];
        
        for (const cellKey of cellsToCheck) {
            const [x, y] = cellKey.split(',').map(Number);
            let aliveNeighbors = 0;
            let neighborColor = null;

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const neighbor = grid.getCell(x + dx, y + dy);
                    if (neighbor && neighbor.color) {
                        aliveNeighbors++;
                        neighborColor = neighbor.color;
                    }
                }
            }

            const isAlive = grid.getCell(x, y) !== undefined;

            if (isAlive && (aliveNeighbors === 2 || aliveNeighbors === 3)) {
                const currentCell = grid.getCell(x, y);
                nextGeneration.push({ x, y, data: { color: currentCell.color || '#ffffff' } });
            } else if (!isAlive && aliveNeighbors === 3) {
                nextGeneration.push({ x, y, data: { color: neighborColor || '#ffffff' } });
            }
        }

        grid.chunks.clear(); 
        
        for (const cell of nextGeneration) {
            grid.setCell(cell.x, cell.y, cell.data);
        }
    }

    onRender(ctx, camera) {
    }
}