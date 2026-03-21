export class ColorPalette {
    constructor() {
        this.isOpen = false;
        this.enabled = true;
        this.colors = [
            { color: '#ffffff', name: 'Blanc' },
            { color: '#ff0000', name: 'Rouge' },
            { color: '#00ff00', name: 'Vert' },
            { color: '#0000ff', name: 'Bleu' },
            { color: '#ffff00', name: 'Jaune' },
            { color: '#ff00ff', name: 'Magenta' },
            { color: '#00ffff', name: 'Cyan' },
            { color: '#000000', name: 'Noir' },
            null
        ];
        this.selectedColor = this.colors[0];
        this.swatchSize = 30;
        this.padding = 10;
    }

    toggle() {
        if (!this.enabled) return;
        this.isOpen = !this.isOpen;
    }

    getColorValue(colorObj) {
        if (colorObj === null) return null;
        if (typeof colorObj === 'object' && colorObj.color) return colorObj.color;
        return colorObj;
    }

    getColorName(colorObj) {
        if (colorObj === null) return 'Gomme';
        if (typeof colorObj === 'object' && colorObj.name) return colorObj.name;
        return typeof colorObj === 'string' ? colorObj : 'Inconnu';
    }

    handleClick(screenX, screenY) {
        if (!this.enabled || !this.isOpen) return false;

        const { x, y, width, height } = this.getBounds();
        if (screenX < x || screenX > x + width || screenY < y || screenY > y + height) {
            return false;
        }

        const localX = screenX - x - this.padding;
        const localY = screenY - y - this.padding;

        const cols = 5;
        const col = Math.floor(localX / (this.swatchSize + this.padding));
        const row = Math.floor(localY / (this.swatchSize + this.padding));

        const index = row * cols + col;
        if (index >= 0 && index < this.colors.length) {
            this.selectedColor = this.colors[index];
        }

        return true;
    }

    getBounds() {
        const cols = 5;
        const rows = Math.ceil(this.colors.length / cols);
        const width = cols * (this.swatchSize + this.padding) + this.padding;
        const height = rows * (this.swatchSize + this.padding) + this.padding;
        const x = (window.innerWidth - width) / 2;
        const y = window.innerHeight - height - 20;
        return { x, y, width, height };
    }

    render(ctx) {
        if (!this.enabled || !this.isOpen) return;

        const { x, y, width, height } = this.getBounds();
        const cols = 5;

        ctx.save();
        ctx.resetTransform();

        ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();
        ctx.stroke();

        for (let i = 0; i < this.colors.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const swatchX = x + this.padding + col * (this.swatchSize + this.padding);
            const swatchY = y + this.padding + row * (this.swatchSize + this.padding);
            
            const colorVal = this.getColorValue(this.colors[i]);

            if (colorVal === null) {
                ctx.fillStyle = '#333';
                ctx.fillRect(swatchX, swatchY, this.swatchSize, this.swatchSize);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(swatchX + 5, swatchY + 5);
                ctx.lineTo(swatchX + this.swatchSize - 5, swatchY + this.swatchSize - 5);
                ctx.moveTo(swatchX + this.swatchSize - 5, swatchY + 5);
                ctx.lineTo(swatchX + 5, swatchY + this.swatchSize - 5);
                ctx.stroke();
            } else {
                ctx.fillStyle = colorVal;
                ctx.fillRect(swatchX, swatchY, this.swatchSize, this.swatchSize);
            }

            if (this.colors[i] === this.selectedColor) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.strokeRect(swatchX - 1.5, swatchY - 1.5, this.swatchSize + 3, this.swatchSize + 3);
            }
        }
        
        const name = this.getColorName(this.selectedColor);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textWidth = ctx.measureText(name).width;
        const bubbleWidth = Math.max(textWidth + 20, 80);
        const bubbleHeight = 30;
        const bubbleX = x + width / 2 - bubbleWidth / 2;
        const bubbleY = y - bubbleHeight - 10;

        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.fillText(name, bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight / 2);

        ctx.restore();
    }
}
