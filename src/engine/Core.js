import { Camera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { DebugDisplay } from './DebugDisplay.js';
import { ColorPalette } from './ColorPalette.js';
import { Grid, CHUNK_SIZE } from './Grid.js';
import { TimeControl } from './TimeControl.js';
import { Profiler } from './Profiler.js';
import { StorageManager } from './StorageManager.js';
import { TextureManager } from './TextureManager.js';

export class Core {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        this.camera = new Camera();
        this.inputManager = new InputManager(this.canvas, this.camera, this);
        this.debugDisplay = new DebugDisplay();
        this.colorPalette = new ColorPalette();
        this.grid = new Grid();
        
        this.timeControl = new TimeControl();
        this.profiler = new Profiler();
        this.storageManager = new StorageManager(this);
        this.textureManager = new TextureManager();
        
        this.cellSize = 32;

        this.lastTime = performance.now();
        this.project = null;
        this.projectName = null;
        this.animationFrameId = null;

        this.uiVisible = true;

        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);
        this.shareProject = this.shareProject.bind(this);
        this.resetProject = this.resetProject.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.colorPalette.enabled = true;
        this.colorPalette.isOpen = true;

        window.addEventListener('resize', this.resize);
        window.addEventListener('keydown', this.handleKeyDown);
        
        this.canvas.style.display = 'block';
    }

    handleKeyDown(e) {
        if (e.key === 'd' || e.key === 'D') {
            this.uiVisible = !this.uiVisible;
            this.debugDisplay.enabled = this.uiVisible;
        }
        if (e.key === 'c' || e.key === 'C') {
            this.colorPalette.toggle();
        }
        if (e.key === 's' || e.key === 'S') {
            this.shareProject();
        }
        if (e.key === 'r' || e.key === 'R') {
            this.resetProject();
        }
        if (e.key === 'Escape') {
            this.quitToMenu();
        }
        if (e.code === 'Space') {
            this.timeControl.togglePause();
            e.preventDefault(); 
        }
        if (e.key === 'n' || e.key === 'N') {
            this.timeControl.step();
        }
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.camera.x === 0 && this.camera.y === 0) {
            this.camera.x = width / 2;
            this.camera.y = height / 2;
        }
    }

    loadProject(project, projectName, initialGridData = null) {
        if (this.project && typeof this.project.destroy === 'function') {
            this.project.destroy();
        }

        this.project = project;
        this.projectName = projectName;
        
        let dataLoaded = false;
        
        if (initialGridData) {
            this.grid.deserialize(initialGridData);
            dataLoaded = true;
        } else {
            dataLoaded = this.storageManager.load();
        }

        if (this.project.onInit) {
            this.project.onInit(this, dataLoaded);
        }

        this.debugDisplay.setCustomData('Partage', 'Touche S');
        this.debugDisplay.setCustomData('Reset', 'Touche R');
        this.debugDisplay.setCustomData('Quitter', 'Échap');
        this.debugDisplay.setCustomData('Step', 'Touche N');
        
        this.resize();
    }

    resetProject() {
        if (!this.project) return;
        
        const confirmReset = window.confirm("Voulez-vous vraiment réinitialiser ?\nTout votre dessin sera perdu.");
        
        if (!confirmReset) {
            return;
        }

        this.grid.chunks.clear();
        
        this.storageManager.clear();
        
        const url = new URL(window.location.href);
        if (url.searchParams.has('d')) {
            url.searchParams.delete('d');
            window.history.replaceState({}, document.title, url.toString());
        }

        this.timeControl.isPaused = true;
        if (this.project.onInit) {
            this.project.onInit(this, false);
        }
        
        this.debugDisplay.setCustomData('Reset OK!', '✔');
        setTimeout(() => this.debugDisplay.removeCustomData('Reset OK!'), 2000);
    }

    shareProject() {
        if (!this.projectName) return;

        const gridData = this.grid.serialize();
        const encodedData = btoa(unescape(encodeURIComponent(gridData)));
        
        const url = new URL(window.location.href);
        url.searchParams.set('p', this.projectName);
        url.searchParams.set('d', encodedData);

        navigator.clipboard.writeText(url.toString()).then(() => {
            this.debugDisplay.setCustomData('Lien copié!', '✔');
            setTimeout(() => {
                this.debugDisplay.removeCustomData('Lien copié!');
            }, 3000);
        }).catch(err => {
            console.error('Erreur lors de la copie du lien:', err);
            this.debugDisplay.setCustomData('Erreur de copie', '❌');
        });
    }

    quitToMenu() {
        this.storageManager.save();

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.project && typeof this.project.destroy === 'function') {
            this.project.destroy();
        }

        window.removeEventListener('resize', this.resize);
        window.removeEventListener('keydown', this.handleKeyDown);
        this.inputManager.destroy();

        this.canvas.style.display = 'none';
        window.history.pushState({}, document.title, window.location.pathname);

        const appElement = document.getElementById('app');
        if (appElement) {
            appElement.style.display = 'flex';
        }
    }

    start() {
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    drawGridLines() {
        const view = this.getViewport();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1 / this.camera.zoom;

        for (let col = view.startCol; col < view.endCol; col++) {
            for (let row = view.startRow; row < view.endRow; row++) {
                this.ctx.strokeRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }

    drawGridCells() {
        const view = this.getViewport();
        const chunkStartCol = Math.floor(view.startCol / CHUNK_SIZE);
        const chunkEndCol = Math.ceil(view.endCol / CHUNK_SIZE);
        const chunkStartRow = Math.floor(view.startRow / CHUNK_SIZE);
        const chunkEndRow = Math.ceil(view.endRow / CHUNK_SIZE);

        for (let cx = chunkStartCol; cx < chunkEndCol; cx++) {
            for (let cy = chunkStartRow; cy < chunkEndRow; cy++) {
                const chunk = this.grid.getChunk(cx, cy);
                if (!chunk) continue;

                for (const [key, data] of chunk.cells.entries()) {
                    const [localX, localY] = key.split(',').map(Number);
                    const cellX = chunk.x * CHUNK_SIZE + localX;
                    const cellY = chunk.y * CHUNK_SIZE + localY;
                    
                    if (data.texture) {
                        const img = this.textureManager.getTexture(data.texture);
                        if (img) {
                             this.ctx.drawImage(img, cellX * this.cellSize, cellY * this.cellSize, this.cellSize, this.cellSize);
                             continue;
                        }
                    }

                    this.ctx.fillStyle = data.color || '#fff';
                    this.ctx.fillRect(cellX * this.cellSize, cellY * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
    }

    getViewport() {
        const left = this.camera.screenToWorld(0, 0).x;
        const right = this.camera.screenToWorld(this.canvas.width, 0).x;
        const top = this.camera.screenToWorld(0, 0).y;
        const bottom = this.camera.screenToWorld(0, this.canvas.height).y;

        return {
            left, right, top, bottom,
            startCol: Math.floor(left / this.cellSize),
            endCol: Math.ceil(right / this.cellSize),
            startRow: Math.floor(top / this.cellSize),
            endRow: Math.ceil(bottom / this.cellSize)
        };
    }

    handleInputs() {
        if (this.project && typeof this.project.handleInputs === 'function') {
            this.project.handleInputs(this);
            return;
        }

        const { mouseState } = this.inputManager;
        const selectedToolName = this.colorPalette.selectedColor ? this.colorPalette.selectedColor : 'Gomme';
        this.debugDisplay.setCustomData('Outil', selectedToolName);

        if (mouseState.isDown && mouseState.isEditing) {
            const worldPos = this.camera.screenToWorld(mouseState.screenX, mouseState.screenY);
            const cellX = Math.floor(worldPos.x / this.cellSize);
            const cellY = Math.floor(worldPos.y / this.cellSize);
            
            if (this.colorPalette.selectedColor === null) {
                this.grid.setCell(cellX, cellY, null);
            } else {
                this.grid.setCell(cellX, cellY, { color: this.colorPalette.selectedColor });
            }
        }
    }

    loop(time) {
        this.profiler.update();
        
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.storageManager.update(time);

        this.handleInputs();

        const ticksToRun = this.timeControl.update(dt);

        if (this.project && this.project.onTick) {
            this.profiler.startTick();
            for (let i = 0; i < ticksToRun; i++) {
                this.project.onTick(this.timeControl.tickInterval, this);
            }
            this.profiler.endTick();
        }

        this.profiler.startRender();
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        this.drawGridLines();
        this.drawGridCells();

        if (this.project && this.project.onRender) {
            this.project.onRender(this.ctx, this.camera);
        }

        this.ctx.restore();
        this.profiler.endRender();

        const alpha = this.uiVisible ? 1.0 : 0.15;

        this.debugDisplay.render(this.ctx, this.inputManager.mouseState, this.camera, this.cellSize);
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        this.profiler.render(this.ctx, this.grid);
        this.timeControl.render(this.ctx);
        
        this.ctx.restore();

        this.colorPalette.render(this.ctx);

        this.animationFrameId = requestAnimationFrame(this.loop);
    }
}