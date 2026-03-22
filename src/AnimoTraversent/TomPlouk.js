import { TOM_PLOUK_QUESTS } from './Quests.js';

export class TomPlouk {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.facingX = 0;
        this.facingY = 1;
        
        this.width = 90;
        this.height = 64;
        
        this.speed = 1.0;
        this.isMoving = false;
        this.moveTimer = 0;
        this.idleTimer = 0;
        
        this.sprite = new window.Image();
        this.sprite.src = '/tom_ploukferme.webp';
        
        this.currentQuestIndex = parseInt(localStorage.getItem('islandCrafter_tom_quest') || '0');
    }

    update(dt, grid, cellSize) {
        if (this.isMoving) {
            this.moveTimer -= dt;
            if (this.moveTimer <= 0) {
                this.isMoving = false;
                this.idleTimer = Math.random() * 3 + 1; 
            } else {
                const nextX = this.x + this.facingX * this.speed;
                const nextY = this.y + this.facingY * this.speed;
                
                if (!this.checkCollision(nextX, nextY, grid, cellSize)) {
                    this.x = nextX;
                    this.y = nextY;
                } else {
                    this.isMoving = false;
                    this.idleTimer = Math.random() * 2 + 0.5;
                }
            }
        } else {
            this.idleTimer -= dt;
            if (this.idleTimer <= 0) {
                const dirs = [
                    {x: 0, y: -1}, {x: 0, y: 1}, 
                    {x: -1, y: 0}, {x: 1, y: 0}
                ];
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                this.facingX = dir.x;
                this.facingY = dir.y;
                
                this.isMoving = true;
                this.moveTimer = Math.random() * 2 + 0.5; 
            }
        }
    }

    checkCollision(newX, newY, grid, cellSize) {
        const checkPoints = [
            { x: newX + 4, y: newY + 4 },
            { x: newX + cellSize - 4, y: newY + 4 },
            { x: newX + 4, y: newY + cellSize - 4 },
            { x: newX + cellSize - 4, y: newY + cellSize - 4 }
        ];

        for (let pt of checkPoints) {
            const cellX = Math.floor(pt.x / cellSize);
            const cellY = Math.floor(pt.y / cellSize);
            const cell = grid.getCell(cellX, cellY);

            if (!cell || cell.solid || cell.id === 'water' || cell.id === 'deep_water' || cell.id === 'abyss') {
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.translate(centerX, centerY);
        
        if (this.isMoving) {
            const tilt = Math.sin(Date.now() * 0.015) * 0.15; 
            ctx.rotate(tilt);
        }

        if (this.sprite.complete) {
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#e67e22'; 
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        
        ctx.restore();
    }

    interact(player, showMessageCallback, onSuccessCallback) {
        const currentQuest = TOM_PLOUK_QUESTS[this.currentQuestIndex];
        if (!currentQuest) return;

        let meetsRequirements = true;
        for (const [item, count] of Object.entries(currentQuest.requirements)) {
            if ((player.inventory[item] || 0) < count) {
                meetsRequirements = false;
                break;
            }
        }

        if (meetsRequirements) {
            for (const [item, count] of Object.entries(currentQuest.requirements)) {
                player.inventory[item] -= count;
            }
            for (const [item, count] of Object.entries(currentQuest.rewards)) {
                player.inventory[item] = (player.inventory[item] || 0) + count;
            }
            
            showMessageCallback(currentQuest.dialogueSuccess);
            if (onSuccessCallback) onSuccessCallback(currentQuest.id);
            
            if (this.currentQuestIndex < TOM_PLOUK_QUESTS.length - 1) {
                this.currentQuestIndex++;
                localStorage.setItem('islandCrafter_tom_quest', this.currentQuestIndex.toString());
            }
            return true;
        } else {
            showMessageCallback(currentQuest.dialoguePending);
            return false;
        }
    }
}
