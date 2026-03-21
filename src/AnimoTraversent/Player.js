export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 250; 
        this.width = 24;
        this.height = 24;
        this.color = '#3498db';

        this.inventory = {
            wood: 50
        };
        this.selectedBlockId = 'wood';

        this.facingX = 0;
        this.facingY = 1;
    }

    update(dt, inputManager, grid, cellSize) {
        let vx = 0;
        let vy = 0;

        if (inputManager.isKeyDown('KeyW') || inputManager.isKeyDown('ArrowUp') || inputManager.isKeyDown('KeyZ')) {
            vy -= 1;
        }
        if (inputManager.isKeyDown('KeyS') || inputManager.isKeyDown('ArrowDown')) {
            vy += 1;
        }
        if (inputManager.isKeyDown('KeyA') || inputManager.isKeyDown('ArrowLeft') || inputManager.isKeyDown('KeyQ')) {
            vx -= 1;
        }
        if (inputManager.isKeyDown('KeyD') || inputManager.isKeyDown('ArrowRight')) {
            vx += 1;
        }

        if (vx !== 0 && vy !== 0) {
            const length = Math.sqrt(vx * vx + vy * vy);
            vx /= length;
            vy /= length;
        }

        if (Math.abs(vx) > 0 || Math.abs(vy) > 0) {
            if (Math.abs(vx) > Math.abs(vy)) {
                this.facingX = vx > 0 ? 1 : -1;
                this.facingY = 0;
            } else {
                this.facingX = 0;
                this.facingY = vy > 0 ? 1 : -1;
            }
        }

        if (vx !== 0) {
            const nextX = this.x + vx * this.speed * dt;
            if (!this.checkCollision(nextX, this.y, grid, cellSize)) {
                this.x = nextX;
            }
        }
        
        if (vy !== 0) {
            const nextY = this.y + vy * this.speed * dt;
            if (!this.checkCollision(this.x, nextY, grid, cellSize)) {
                this.y = nextY;
            }
        }
    }

    checkCollision(px, py, grid, cellSize) {
        const halfW = (this.width / 2) * 0.8;
        const halfH = (this.height / 2) * 0.8;
        
        const corners = [
            { x: px - halfW, y: py - halfH },
            { x: px + halfW, y: py - halfH },
            { x: px - halfW, y: py + halfH },
            { x: px + halfW, y: py + halfH }
        ];

        for (let corner of corners) {
            const cx = Math.floor(corner.x / cellSize);
            const cy = Math.floor(corner.y / cellSize);
            const cell = grid.getCell(cx, cy);
            
            if (cell && cell.solid) {
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Direction indicator
        ctx.strokeStyle = '#f1c40f'; // Ligne jaune visuelle
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.facingX * (this.width), this.y + this.facingY * (this.height));
        ctx.stroke();
    }
}
