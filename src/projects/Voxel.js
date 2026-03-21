/**
 * Projet : Voxel
 * Concept : Rendu de paysages avec élévation via Raycasting
 */
export class Voxel {
    constructor() {
        this.materials = {
            DEEP_WATER: { type: 'TERRAIN', color: '#002288', height: 0, name: 'Océan' },
            WATER: { type: 'TERRAIN', color: '#0077ff', height: 5, name: 'Rivière' },
            SAND: { type: 'TERRAIN', color: '#eebb55', height: 15, name: 'Sable' },
            GRASS: { type: 'TERRAIN', color: '#22aa22', height: 35, name: 'Herbe' },
            DIRT: { type: 'TERRAIN', color: '#664422', height: 55, name: 'Terre' },
            ROCK: { type: 'TERRAIN', color: '#777777', height: 90, name: 'Montagne' },
            SNOW: { type: 'TERRAIN', color: '#ffffff', height: 130, name: 'Neige' }
        };

        this.paletteColors = [
            { color: this.materials.DEEP_WATER.color, name: 'Océan (H: 0)' },
            { color: this.materials.SAND.color, name: 'Sable (H: 15)' },
            { color: this.materials.GRASS.color, name: 'Herbe (H: 35)' },
            { color: this.materials.DIRT.color, name: 'Terre (H: 55)' },
            { color: this.materials.ROCK.color, name: 'Montagne (H: 90)' },
            { color: this.materials.SNOW.color, name: 'Neige (H: 130)' },
            null
        ];

        this.posX = 50;
        this.posY = 50;
        this.angle = 0;
        this.cameraHeight = 150;
        this.horizon = 100;

        this.keys = { forward: false, backward: false, left: false, right: false, up: false, down: false };
        this.engine = null;

        this.handleKeyDown = (e) => this.setKey(e.key, true);
        this.handleKeyUp = (e) => this.setKey(e.key, false);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    setKey(key, isDown) {
        const k = key.toLowerCase();
        if (k === 'arrowup') this.keys.forward = isDown;
        if (k === 'arrowdown') this.keys.backward = isDown;
        if (k === 'arrowleft') this.keys.right = isDown;
        if (k === 'arrowright') this.keys.left = isDown;

        if (k === 'capslock') this.keys.up = isDown;
        if (k === 'control') this.keys.down = isDown;
    }

    onInit(engine, dataLoaded) {
        this.engine = engine;

        engine.debugDisplay.setCustomData('Projet', 'Voxel 3D');
        engine.debugDisplay.setCustomData('Mouvement', 'Flèches Directionnelles');
        engine.debugDisplay.setCustomData('Altitude', 'Shift (Monter) / Ctrl (Descendre)');

        engine.timeControl.setTPS(60);
        engine.timeControl.togglePause();

        engine.colorPalette.colors = this.paletteColors;
        engine.colorPalette.selectedColor = this.paletteColors[2];
        engine.colorPalette.enabled = true;
        if (!engine.colorPalette.isOpen) engine.colorPalette.toggle();

        engine.camera.x = 0;
        engine.camera.y = window.innerHeight / 2;
        engine.camera.zoom = 1;

        if (!dataLoaded) {
            this.buildIslandMap(engine.grid);
        }
    }

    buildIslandMap(grid) {
        const center = 50;
        const radius = 45;

        for (let x = 0; x < 100; x++) {
            for (let y = 0; y < 100; y++) {
                const distX = (x - center) / radius;
                const distY = (y - center) / radius;
                const distSq = (distX * distX) + (distY * distY);

                let noise = 0;
                noise += Math.sin(x * 0.15) * Math.cos(y * 0.15) * 1.0;
                noise += Math.sin(x * 0.35 + 1.5) * Math.cos(y * 0.35 + 0.5) * 0.5;
                noise += Math.sin(x * 0.8) * Math.cos(y * 0.7) * 0.25;

                noise = (noise + 1.75) / 3.5;

                let elevation = noise - (distSq * 1.2);

                let smoothHeight = Math.max(0, Math.floor((elevation + 0.1) * 200));

                let mat;
                if (elevation > 0.55) mat = this.materials.SNOW;
                else if (elevation > 0.35) mat = this.materials.ROCK;
                else if (elevation > 0.15) mat = this.materials.DIRT;
                else if (elevation > 0.05) mat = this.materials.GRASS;
                else if (elevation > -0.05) mat = this.materials.SAND;
                else if (elevation > -0.15) {
                    mat = this.materials.WATER;
                    smoothHeight = 5;
                } else {
                    mat = this.materials.DEEP_WATER;
                    smoothHeight = 0;
                }
                grid.setCell(x, y, { ...mat, height: smoothHeight });
            }
        }
    }

    handleInputs(engine) {
        const { mouseState } = engine.inputManager;

        if (mouseState.isDown && mouseState.isEditing) {
            const worldPos = engine.camera.screenToWorld(mouseState.screenX, mouseState.screenY);
            const cx = Math.floor(worldPos.x / engine.cellSize);
            const cy = Math.floor(worldPos.y / engine.cellSize);

            const selected = engine.colorPalette.selectedColor;

            const radius = 2;
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (dx*dx + dy*dy <= radius*radius) {
                        if (selected === null) {
                            engine.grid.setCell(cx + dx, cy + dy, null);
                        } else {
                            let height = 0;
                            for (const key in this.materials) {
                                if (this.materials[key].color === selected.color) {
                                    height = this.materials[key].height;
                                    break;
                                }
                            }
                            engine.grid.setCell(cx + dx, cy + dy, { type: 'TERRAIN', color: selected.color, height: height });
                        }
                    }
                }
            }
        }
    }

    onTick(dt, engine) {
        const moveSpeed = 0.5;
        const rotSpeed = 0.05;
        const flySpeed = 3;

        if (this.keys.forward) {
            this.posX += Math.cos(this.angle) * moveSpeed;
            this.posY += Math.sin(this.angle) * moveSpeed;
        }
        if (this.keys.backward) {
            this.posX -= Math.cos(this.angle) * moveSpeed;
            this.posY -= Math.sin(this.angle) * moveSpeed;
        }

        if (this.keys.left) this.angle -= rotSpeed;
        if (this.keys.right) this.angle += rotSpeed;

        if (this.keys.up) this.cameraHeight += flySpeed;
        if (this.keys.down) this.cameraHeight -= flySpeed;
    }

    onRender(ctx, camera) {
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(this.posX * 32, this.posY * 32, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.posX * 32, this.posY * 32);
        ctx.lineTo((this.posX + Math.cos(this.angle)*5) * 32, (this.posY + Math.sin(this.angle)*5) * 32);
        ctx.stroke();

        // --- 2. VUE 3D VOXEL ---
        ctx.save();
        ctx.resetTransform();

        const w = window.innerWidth;
        const h = window.innerHeight;
        const halfW = w / 2;

        ctx.beginPath();
        ctx.rect(halfW, 0, halfW, h);
        ctx.clip();

        const gradient = ctx.createLinearGradient(halfW, 0, halfW, h);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#e0f6ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(halfW, 0, halfW, h);

        const resolution = 3;
        const zFar = 60;

        const sinAngle = Math.sin(this.angle);
        const cosAngle = Math.cos(this.angle);

        const yBuffer = new Array(Math.floor(halfW / resolution)).fill(h);

        for (let z = 1; z < zFar; z += 0.5) {
            const pLeftX = this.posX + (cosAngle - sinAngle) * z;
            const pLeftY = this.posY + (sinAngle + cosAngle) * z;
            const pRightX = this.posX + (cosAngle + sinAngle) * z;
            const pRightY = this.posY + (sinAngle - cosAngle) * z;

            const dx = (pRightX - pLeftX) / (halfW / resolution);
            const dy = (pRightY - pLeftY) / (halfW / resolution);

            let currentX = pLeftX;
            let currentY = pLeftY;

            for (let x = 0; x < halfW; x += resolution) {
                const mapX = Math.floor(currentX);
                const mapY = Math.floor(currentY);

                const cell = this.engine.grid.getCell(mapX, mapY);

                if (cell) {
                    const cellHeight = cell.height !== undefined ? cell.height : 0;
                    const cellColor = cell.color || '#ff00ff';

                    const heightOnScreen = (this.cameraHeight - cellHeight) / z * 100 + this.horizon;
                    const drawY = Math.floor(heightOnScreen);

                    const bufferIndex = Math.floor(x / resolution);

                    if (drawY < yBuffer[bufferIndex]) {

                        ctx.fillStyle = cellColor;
                        ctx.fillRect(halfW + x, Math.max(0, drawY), resolution, yBuffer[bufferIndex] - Math.max(0, drawY));

                        const fogAlpha = Math.min(1.0, z / zFar);
                        ctx.fillStyle = `rgba(224, 246, 255, ${fogAlpha})`;
                        ctx.fillRect(halfW + x, Math.max(0, drawY), resolution, yBuffer[bufferIndex] - Math.max(0, drawY));

                        yBuffer[bufferIndex] = Math.max(0, drawY);
                    }
                }
                currentX += dx;
                currentY += dy;
            }
        }

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(halfW, 0);
        ctx.lineTo(halfW, h);
        ctx.stroke();

        ctx.restore();
    }
}