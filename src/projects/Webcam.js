/**
 * Projet : Webcam
 * Concept : Traitement d'image avancé et effets visuels en temps réel.
 */
export class Webcam {
    constructor() {
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.style.display = 'none';

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this.width = 160;
        this.height = 90;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.streamActive = false;
        this.frameCount = 0;

        this.paletteColors = [
            { color: '#ffffff', name: '0. Normal' },
            { color: '#ff0000', name: '1. Vision Thermique tah Predator' },
            { color: '#00ffff', name: '2. Néon' },
            { color: '#ff00ff', name: '3. Glitch' },
            { color: '#ffff00', name: '4. Pop Art' },
            { color: '#8bac0f', name: '5. Gameboy' }
        ];
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', 'Webcam');
        engine.debugDisplay.setCustomData('Résolution', `${this.width} x ${this.height}`);
        engine.timeControl.setTPS(30);

        engine.colorPalette.colors = this.paletteColors;
        engine.colorPalette.selectedColor = this.paletteColors[0];
        engine.colorPalette.enabled = true;
        engine.timeControl.togglePause();

        if (!engine.colorPalette.isOpen) {
            engine.colorPalette.toggle();
        }

        if (!dataLoaded) {
            navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 180 } })
                .then(stream => {
                    this.video.srcObject = stream;
                    this.streamActive = true;
                })
                .catch(err => {
                    console.error("Erreur Webcam :", err);
                    engine.debugDisplay.setCustomData('Erreur', 'Caméra non autorisée');
                });
        }
    }

    handleInputs(engine) {
    }

    rgbToHex(r, g, b) {
        return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
    }

    onTick(dt, engine) {
        if (!this.streamActive || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) return;

        this.frameCount++;
        this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;

        const offsetX = -Math.floor(this.width / 2);
        const offsetY = -Math.floor(this.height / 2);

        const selectedFilter = engine.colorPalette.selectedColor
            ? engine.colorPalette.selectedColor.name
            : '0. Normal';

        const updatedCells = new Set();

        const glitchOffset = Math.random() > 0.8 ? Math.floor(Math.random() * 10) : 2;
        const glitchRow = Math.random() > 0.9 ? Math.floor(Math.random() * this.height) : -1;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const index = (y * this.width + x) * 4;
                let r = data[index];
                let g = data[index + 1];
                let b = data[index + 2];
                const avg = (r + g + b) / 3;

                if (selectedFilter === '1. Vision Thermique tah Predator') {
                    if (avg < 64) { r = 0; g = 0; b = avg * 4; }
                    else if (avg < 128) { r = 0; g = (avg - 64) * 4; b = 255 - (avg - 64) * 4; }
                    else if (avg < 192) { r = (avg - 128) * 4; g = 255; b = 0; }
                    else { r = 255; g = 255; b = (avg - 192) * 4; }
                }
                else if (selectedFilter === '2. Néon') {
                    let edge = 0;
                    if (x < this.width - 1 && y < this.height - 1) {
                        const rightIdx = index + 4;
                        const downIdx = index + this.width * 4;
                        const avgRight = (data[rightIdx] + data[rightIdx+1] + data[rightIdx+2]) / 3;
                        const avgDown = (data[downIdx] + data[downIdx+1] + data[downIdx+2]) / 3;

                        edge = Math.abs(avg - avgRight) + Math.abs(avg - avgDown);
                    }

                    if (edge > 30) {
                        r = 0; g = 255; b = 255;
                    } else {
                        r = 10; g = 10; b = 20;
                    }
                }
                else if (selectedFilter === '3. Glitch') {
                    let shift = glitchOffset;
                    if (y === glitchRow || y === glitchRow + 1) shift = 20;

                    const rIdx = Math.min((y * this.width + x + shift) * 4, data.length - 4);
                    const bIdx = Math.max((y * this.width + x - shift) * 4, 0);

                    r = data[rIdx];
                    b = data[bIdx + 2];
                }
                else if (selectedFilter === '4. Pop Art') {
                    if (avg < 80) { r = 30; g = 0; b = 60; }
                    else if (avg < 160) { r = 255; g = 20; b = 147; }
                    else { r = 255; g = 255; b = 0; }
                }
                else if (selectedFilter === '5. Gameboy') {
                    if (avg < 64) { r = 15; g = 56; b = 15; }
                    else if (avg < 128) { r = 48; g = 98; b = 48; }
                    else if (avg < 192) { r = 139; g = 172; b = 15; }
                    else { r = 155; g = 188; b = 15; }
                }

                r = Math.floor(Math.max(0, Math.min(255, r)));
                g = Math.floor(Math.max(0, Math.min(255, g)));
                b = Math.floor(Math.max(0, Math.min(255, b)));

                const mirrorX = offsetX + (this.width - 1 - x);
                const finalY = offsetY + y;
                const hexColor = this.rgbToHex(r, g, b);

                const currentCell = engine.grid.getCell(mirrorX, finalY);
                if (!currentCell || currentCell.color !== hexColor) {
                    engine.grid.setCell(mirrorX, finalY, { type: 'CAM_PIXEL', color: hexColor });
                    updatedCells.add(`${mirrorX},${finalY}`);
                }
            }
        }
    }

    onRender(ctx, camera) {}
}