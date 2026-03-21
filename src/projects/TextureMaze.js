export class TextureMaze {
    constructor() {
        this.mazeSize = 21;
        this.mazeGenerated = false;
        
        this.isSolving = false;
        this.playerPos = null;
        this.endPos = null;
        this.path = [];
        this.texturesLoaded = false;
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', 'Labyrinthe');
        engine.debugDisplay.setCustomData('Générer', 'Touche G');
        engine.debugDisplay.setCustomData('Résoudre', 'Touche F');
        
        engine.timeControl.setTPS(10);

        engine.colorPalette.colors = [];
        engine.colorPalette.enabled = false;

        engine.textureManager.loadAll({
            'maze_wall': '/assets/wall.png',
            'maze_path': '/assets/path.png',
            'maze_player': '/assets/player.png',
            'maze_goal': '/assets/goal.png'
        }).then(() => {
            this.texturesLoaded = true;
            if (!dataLoaded) {
                this.generateMaze(engine.grid);
            }
        }).catch(err => {
            console.error("Erreur de chargement des textures.", err);
            this.texturesLoaded = true;
            if (!dataLoaded) {
                this.generateMaze(engine.grid);
            }
        });

        this.handleKeyDown = (e) => {
            if (!this.texturesLoaded) return;
            
            if (e.key === 'g' || e.key === 'G') {
                this.generateMaze(engine.grid);
            }
            if (e.key === 'f' || e.key === 'F') {
                this.startSolver(engine.grid);
                engine.timeControl.isPaused = false;
            }
        };
        window.addEventListener('keydown', this.handleKeyDown);
    }

    getCellData(type) {
        switch(type) {
            case 'WALL': return { texture: 'maze_wall', color: '#444444', type: 'WALL' };
            case 'PATH': return { texture: 'maze_path', color: '#cccccc', type: 'PATH' };
            case 'PLAYER': return { texture: 'maze_player', color: '#ff0000', type: 'PLAYER' };
            case 'GOAL': return { texture: 'maze_goal', color: '#00ff00', type: 'GOAL' };
            case 'VISITED': return { texture: 'maze_path', color: '#aaaaff', type: 'PATH' };
            default: return null;
        }
    }

    generateMaze(grid) {
        grid.chunks.clear();
        this.isSolving = false;
        this.path = [];

        const width = this.mazeSize;
        const height = this.mazeSize;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                grid.setCell(x, y, this.getCellData('WALL'));
            }
        }

        const stack = [];
        const startX = 1;
        const startY = 1;
        
        grid.setCell(startX, startY, this.getCellData('PATH'));
        stack.push({x: startX, y: startY});

        const dirs = [
            {dx: 0, dy: -2}, {dx: 2, dy: 0},
            {dx: 0, dy: 2}, {dx: -2, dy: 0}
        ];

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            
            for (let i = dirs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
            }

            let moved = false;
            for (const dir of dirs) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;

                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
                    const cell = grid.getCell(nx, ny);
                    if (cell && cell.type === 'WALL') {
                        grid.setCell(current.x + dir.dx/2, current.y + dir.dy/2, this.getCellData('PATH'));
                        grid.setCell(nx, ny, this.getCellData('PATH'));
                        stack.push({x: nx, y: ny});
                        moved = true;
                        break;
                    }
                }
            }

            if (!moved) {
                stack.pop();
            }
        }

        this.playerPos = { x: 1, y: 1 };
        this.endPos = { x: width - 2, y: height - 2 };

        grid.setCell(this.playerPos.x, this.playerPos.y, this.getCellData('PLAYER'));
        grid.setCell(this.endPos.x, this.endPos.y, this.getCellData('GOAL'));
    }

    startSolver(grid) {
        if (!this.playerPos || !this.endPos) return;

        const queue = [{ x: this.playerPos.x, y: this.playerPos.y, path: [] }];
        const visited = new Set();
        visited.add(`${this.playerPos.x},${this.playerPos.y}`);

        const dirs = [{dx:0, dy:-1}, {dx:1, dy:0}, {dx:0, dy:1}, {dx:-1, dy:0}];
        
        let foundPath = null;

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === this.endPos.x && current.y === this.endPos.y) {
                foundPath = current.path;
                break;
            }

            for (const dir of dirs) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                const key = `${nx},${ny}`;

                if (!visited.has(key)) {
                    const cell = grid.getCell(nx, ny);
                    if (cell && (cell.type === 'PATH' || cell.type === 'GOAL')) {
                        visited.add(key);
                        queue.push({ x: nx, y: ny, path: [...current.path, {x: nx, y: ny}] });
                    }
                }
            }
        }

        if (foundPath && foundPath.length > 0) {
            this.path = foundPath;
            this.isSolving = true;
        } else {
            console.log("Aucun chemin trouvé !");
        }
    }

    onTick(dt, engine) {
        if (!this.isSolving || this.path.length === 0) return;

        const nextStep = this.path.shift();

        engine.grid.setCell(this.playerPos.x, this.playerPos.y, this.getCellData('PATH'));

        this.playerPos = nextStep;

        if (this.playerPos.x === this.endPos.x && this.playerPos.y === this.endPos.y) {
            this.isSolving = false;
            engine.grid.setCell(this.playerPos.x, this.playerPos.y, this.getCellData('GOAL'));
            engine.debugDisplay.setCustomData('Statut', 'Sortie trouvée !');
            setTimeout(() => engine.debugDisplay.removeCustomData('Statut'), 3000);
        } else {
            engine.grid.setCell(this.playerPos.x, this.playerPos.y, this.getCellData('PLAYER'));
        }
    }

    onRender(ctx, camera) {
    }

    handleInputs(engine) {
    }

    destroy() {
        if (this.handleKeyDown) {
            window.removeEventListener('keydown', this.handleKeyDown);
        }
    }
}