export class DebugDisplay {
    constructor() {
        this.enabled = true;
        this.customData = {};
    }

    toggle() {
        this.enabled = !this.enabled;
    }

    setCustomData(key, value) {
        this.customData[key] = value;
    }

    removeCustomData(key) {
        delete this.customData[key];
    }

    render(ctx, mouseState, camera, cellSize) {
        const alpha = this.enabled ? 1.0 : 0.15;

        const worldPos = camera.screenToWorld(mouseState.screenX, mouseState.screenY);
        
        const cellX = Math.floor(worldPos.x / cellSize);
        const cellY = Math.floor(worldPos.y / cellSize);

        let lines = [
            `Cell: (${cellX}, ${cellY})`,
            `Zoom: ${camera.zoom.toFixed(2)}x`,
            `Cacher debug: Touche D`,
        ];

        for (const [key, value] of Object.entries(this.customData)) {
            lines.push(`${key}: ${value}`);
        }

        ctx.save();
        ctx.resetTransform(); 
        
        ctx.globalAlpha = alpha;
        
        ctx.font = '14px monospace';
        const lineHeight = 18;
        const padding = 10;
        
        let maxWidth = 0;
        for (const line of lines) {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        }

        const boxWidth = maxWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;
        
        const boxX = 10;
        const boxY = 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], boxX + padding, boxY + padding + i * lineHeight);
        }

        ctx.restore();
    }
}
