/**
 * Projet : Doom (Raycasting 3D)
 * Concept : Moteur 3D temps réel généré à partir de la grille 2D.
 */
export class Doom {
    constructor() {
        this.materials = {
            WALL: { type: 'WALL', color: '#8b0000', name: 'Mur' },
            WALL_NEON: { type: 'WALL', color: '#00ffcc', name: 'Mur Néon' }
        };

        this.paletteColors = [
            { color: this.materials.WALL.color, name: 'Mur' },
            { color: this.materials.WALL_NEON.color, name: 'Mur Néon' },
            null
        ];

        this.posX = 5.5;
        this.posY = 5.5;
        this.dirX = -1.0;
        this.dirY = 0.0;
        this.planeX = 0.0;
        this.planeY = 0.66;

        this.keys = { up: false, down: false, left: false, right: false };
        this.engine = null;

        this.handleKeyDown = (e) => this.setKey(e.key, true);
        this.handleKeyUp = (e) => this.setKey(e.key, false);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    setKey(key, isDown) {
        const k = key.toLowerCase();
        if (k === 'arrowup') this.keys.up = isDown;
        if (k === 'arrowdown') this.keys.down = isDown;
        if (k === 'arrowleft') this.keys.left = isDown;
        if ( k === 'arrowright') this.keys.right = isDown;
    }

    onInit(engine, dataLoaded) {
        this.engine = engine;

        engine.debugDisplay.setCustomData('Projet', 'Doom');
        engine.debugDisplay.setCustomData('Mouvement', 'Fleches');

        engine.timeControl.setTPS(60);

        engine.colorPalette.colors = this.paletteColors;
        engine.colorPalette.selectedColor = this.paletteColors[0];
        engine.colorPalette.enabled = true;
        if (!engine.colorPalette.isOpen) {
            engine.colorPalette.toggle();
        }
        engine.timeControl.togglePause();
        engine.camera.x = window.innerWidth / 4;
        engine.camera.y = window.innerHeight / 2;
        engine.camera.zoom = 1.5;

        if (!dataLoaded) {
            this.buildStarterMap(engine.grid);
        }
    }

    buildStarterMap(grid) {
        for (let x = 0; x <= 15; x++) {
            for (let y = 0; y <= 15; y++) {
                if (x === 0 || x === 15 || y === 0 || y === 15) {
                    grid.setCell(x, y, { ...this.materials.WALL });
                }
            }
        }
        grid.setCell(8, 8, { ...this.materials.WALL_NEON });
        grid.setCell(8, 9, { ...this.materials.WALL_NEON });
    }

    onTick(dt, engine) {
        const moveSpeed = 0.08;
        const rotSpeed = 0.05;

        if (this.keys.up) {
            if (!engine.grid.getCell(Math.floor(this.posX + this.dirX * moveSpeed), Math.floor(this.posY))) {
                this.posX += this.dirX * moveSpeed;
            }
            if (!engine.grid.getCell(Math.floor(this.posX), Math.floor(this.posY + this.dirY * moveSpeed))) {
                this.posY += this.dirY * moveSpeed;
            }
        }
        if (this.keys.down) {
            if (!engine.grid.getCell(Math.floor(this.posX - this.dirX * moveSpeed), Math.floor(this.posY))) {
                this.posX -= this.dirX * moveSpeed;
            }
            if (!engine.grid.getCell(Math.floor(this.posX), Math.floor(this.posY - this.dirY * moveSpeed))) {
                this.posY -= this.dirY * moveSpeed;
            }
        }

        if (this.keys.right) {
            const oldDirX = this.dirX;
            this.dirX = this.dirX * Math.cos(-rotSpeed) - this.dirY * Math.sin(-rotSpeed);
            this.dirY = oldDirX * Math.sin(-rotSpeed) + this.dirY * Math.cos(-rotSpeed);
            const oldPlaneX = this.planeX;
            this.planeX = this.planeX * Math.cos(-rotSpeed) - this.planeY * Math.sin(-rotSpeed);
            this.planeY = oldPlaneX * Math.sin(-rotSpeed) + this.planeY * Math.cos(-rotSpeed);
        }
        if (this.keys.left) {
            const oldDirX = this.dirX;
            this.dirX = this.dirX * Math.cos(rotSpeed) - this.dirY * Math.sin(rotSpeed);
            this.dirY = oldDirX * Math.sin(rotSpeed) + this.dirY * Math.cos(rotSpeed);
            const oldPlaneX = this.planeX;
            this.planeX = this.planeX * Math.cos(rotSpeed) - this.planeY * Math.sin(rotSpeed);
            this.planeY = oldPlaneX * Math.sin(rotSpeed) + this.planeY * Math.cos(rotSpeed);
        }
    }

    onRender(ctx, camera) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.posX * 32, this.posY * 32, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.posX * 32, this.posY * 32);
        ctx.lineTo((this.posX + this.dirX) * 32, (this.posY + this.dirY) * 32);
        ctx.stroke();

        ctx.save();
        ctx.resetTransform();

        const w = window.innerWidth;
        const h = window.innerHeight;
        const halfW = w / 2;

        ctx.beginPath();
        ctx.rect(halfW, 0, halfW, h);
        ctx.clip();

        ctx.fillStyle = '#222222';
        ctx.fillRect(halfW, 0, halfW, h / 2);
        ctx.fillStyle = '#444444';
        ctx.fillRect(halfW, h / 2, halfW, h / 2);

        const resolution = 4;

        for (let x = 0; x < halfW; x += resolution) {
            const cameraX = 2 * (x / halfW) - 1;
            const rayDirX = this.dirX + this.planeX * cameraX;
            const rayDirY = this.dirY + this.planeY * cameraX;

            let mapX = Math.floor(this.posX);
            let mapY = Math.floor(this.posY);

            let sideDistX;
            let sideDistY;

            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);
            let perpWallDist;

            let stepX;
            let stepY;
            let hit = 0;
            let side = 0;
            let hitColor = '#ffffff';

            if (rayDirX < 0) {
                stepX = -1;
                sideDistX = (this.posX - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - this.posX) * deltaDistX;
            }
            if (rayDirY < 0) {
                stepY = -1;
                sideDistY = (this.posY - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - this.posY) * deltaDistY;
            }

            let steps = 0;
            while (hit === 0 && steps < 30) {
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }

                const cell = this.engine.grid.getCell(mapX, mapY);
                if (cell) {
                    hit = 1;
                    hitColor = cell.color || '#ffffff';
                }
                steps++;
            }

            if (hit === 1) {
                if (side === 0) perpWallDist = (sideDistX - deltaDistX);
                else            perpWallDist = (sideDistY - deltaDistY);

                const lineHeight = Math.floor(h / perpWallDist);

                let drawStart = -lineHeight / 2 + h / 2;
                if (drawStart < 0) drawStart = 0;
                let drawEnd = lineHeight / 2 + h / 2;
                if (drawEnd >= h) drawEnd = h - 1;

                ctx.fillStyle = hitColor;
                ctx.fillRect(halfW + x, drawStart, resolution, drawEnd - drawStart);

                if (side === 1) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fillRect(halfW + x, drawStart, resolution, drawEnd - drawStart);
                }

                const fogAlpha = Math.min(1.0, perpWallDist / 12);
                ctx.fillStyle = `rgba(0, 0, 0, ${fogAlpha})`;
                ctx.fillRect(halfW + x, drawStart, resolution, drawEnd - drawStart);
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