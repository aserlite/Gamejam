export class Profiler {
    constructor() {
        this.frames = 0;
        this.lastFpsTime = performance.now();
        this.fps = 0;
        
        this.tickTime = 0;
        this.renderTime = 0;
    }

    startTick() {
        this.tickStart = performance.now();
    }

    endTick() {
        this.tickTime = performance.now() - this.tickStart;
    }

    startRender() {
        this.renderStart = performance.now();
    }

    endRender() {
        this.renderTime = performance.now() - this.renderStart;
    }

    update() {
        this.frames++;
        const now = performance.now();
        if (now - this.lastFpsTime >= 1000) {
            this.fps = this.frames;
            this.frames = 0;
            this.lastFpsTime = now;
        }
    }

    render(ctx, grid) {
        ctx.save();
        ctx.resetTransform();

        let activeChunks = grid.chunks.size;
        let activeCells = 0;
        for (const chunk of grid.chunks.values()) {
            activeCells += chunk.cells.size;
        }

        const lines = [
            `FPS: ${this.fps}`,
            `Tick: ${this.tickTime.toFixed(1)}ms`,
            `Draw: ${this.renderTime.toFixed(1)}ms`,
            `Chunks: ${activeChunks}`,
            `Cells: ${activeCells}`
        ];

        const padding = 10;
        const lineHeight = 18;
        const boxWidth = 140;
        const boxHeight = lines.length * lineHeight + padding * 2;
        
        const boxX = ctx.canvas.width - boxWidth - 10;
        const boxY = 10;

        ctx.fillStyle = this.fps > 0 && this.fps < 30 ? 'rgba(100, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        for (let i = 0; i < lines.length; i++) {
            if (i === 1 && this.tickTime > 16) ctx.fillStyle = '#ff5555';
            else if (i === 2 && this.renderTime > 16) ctx.fillStyle = '#ff5555';
            else ctx.fillStyle = '#fff';

            ctx.fillText(lines[i], boxX + padding, boxY + padding + i * lineHeight);
        }

        ctx.restore();
    }
}
