/**
 * Projet : Le Labyrinthe Vivant
 * Concept : Génération procédurale d'un labyrinthe et résolution par Automate Cellulaire.
 */
export class MazeSolver {
    constructor() {
        this.materials = {
            WALL: { type: 'WALL', color: '#2c3e50', name: 'Mur' },
            START: { type: 'START', color: '#ff3366', name: 'Départ' },
            END: { type: 'END', color: '#33ff66', name: 'Arrivée' },
            HEAD: { type: 'HEAD', color: '#ffffff', name: 'Le Pixel' },
            TRAIL: { type: 'TRAIL', color: '#00aaff', name: 'Chemin Actif' },
            DEAD: { type: 'DEAD', color: '#111118', name: 'Cul-de-sac' },
            WIN_PATH: { type: 'WIN_PATH', color: '#ffea00', name: 'Chemin Gagnant' }
        };

        this.mazeRadius = 25;
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', 'Labyrinthe Vivant');

        engine.timeControl.setTPS(30);

        engine.colorPalette.colors = [];
        engine.colorPalette.enabled = false;

        if (!dataLoaded) {
            this.generateMaze(engine.grid);
        }
    }

    /**
     * Algorithme de génération de labyrinthe
     */
    generateMaze(grid) {
        const rad = this.mazeRadius;

        for (let x = -rad; x <= rad; x++) {
            for (let y = -rad; y <= rad; y++) {
                grid.setCell(x, y, { ...this.materials.WALL });
            }
        }

        const startX = -rad + 1;
        const startY = -rad + 1;
        const stack = [{ x: startX, y: startY }];
        grid.setCell(startX, startY, null);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]].sort(() => Math.random() - 0.5);
            let moved = false;

            for (const [dx, dy] of dirs) {
                const nx = current.x + dx;
                const ny = current.y + dy;

                if (nx > -rad && nx < rad && ny > -rad && ny < rad) {
                    const target = grid.getCell(nx, ny);
                    if (target && target.type === 'WALL') {
                        grid.setCell(nx, ny, null);
                        grid.setCell(current.x + dx / 2, current.y + dy / 2, null);

                        stack.push({ x: nx, y: ny });
                        moved = true;
                        break;
                    }
                }
            }
            if (!moved) stack.pop();
        }

        grid.setCell(-rad, -rad + 1, { ...this.materials.START });
        grid.setCell(startX, startY, { ...this.materials.HEAD });

        grid.setCell(rad, rad - 1, { ...this.materials.END });
        grid.setCell(rad - 1, rad - 1, null);
    }

    handleInputs(engine) {
    }

    onTick(dt, engine) {
        const activeCells = [];
        const updatedCells = new Set();

        for (const chunk of engine.grid.chunks.values()) {
            for (const [localKey, data] of chunk.cells.entries()) {
                if (data.type === 'HEAD' || data.type === 'WIN_PATH') {
                    const [localX, localY] = localKey.split(',').map(Number);
                    activeCells.push({ x: chunk.x * 32 + localX, y: chunk.y * 32 + localY, data });
                }
            }
        }

        for (const cell of activeCells) {
            const { x, y, data } = cell;
            if (updatedCells.has(`${x},${y}`)) continue;

            if (data.type === 'HEAD') {
                const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                let foundEnd = false;
                const emptyNeighbors = [];
                const trailNeighbors = [];

                for (const [dx, dy] of dirs) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const neighbor = engine.grid.getCell(nx, ny);

                    if (neighbor && neighbor.type === 'END') {
                        foundEnd = true;
                        break;
                    } else if (!neighbor) {
                        emptyNeighbors.push({ nx, ny });
                    } else if (neighbor.type === 'TRAIL') {
                        trailNeighbors.push({ nx, ny, data: neighbor });
                    }
                }

                if (foundEnd) {
                    engine.grid.setCell(x, y, { ...this.materials.WIN_PATH });
                    updatedCells.add(`${x},${y}`);
                    continue;
                }

                if (emptyNeighbors.length > 0) {
                    const next = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                    engine.grid.setCell(next.nx, next.ny, { ...this.materials.HEAD });
                    engine.grid.setCell(x, y, { ...this.materials.TRAIL });
                    updatedCells.add(`${next.nx},${next.ny}`);
                }
                else if (trailNeighbors.length > 0) {
                    const prev = trailNeighbors[0];
                    engine.grid.setCell(prev.nx, prev.ny, { ...this.materials.HEAD });
                    engine.grid.setCell(x, y, { ...this.materials.DEAD });
                    updatedCells.add(`${prev.nx},${prev.ny}`);
                }
            }

            else if (data.type === 'WIN_PATH') {
                const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                for (const [dx, dy] of dirs) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const neighbor = engine.grid.getCell(nx, ny);

                    if (neighbor && neighbor.type === 'TRAIL') {
                        engine.grid.setCell(nx, ny, { ...this.materials.WIN_PATH });
                        updatedCells.add(`${nx},${ny}`);
                    }
                }
            }
        }
    }

    onRender(ctx, camera) {
    }
}