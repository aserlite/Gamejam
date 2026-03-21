/**
 * Projet : Spectre Audio
 * Concept : L'audio du micro génère des particules
 */
export class Audio {
    constructor() {
        this.audioCtx = null;
        this.analyser = null;
        this.dataArray = null;
        this.streamActive = false;

        this.spectrumWidth = 64;
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', '🎵 Spectre Cinétique');
        engine.debugDisplay.setCustomData('Statut', 'En attente du micro...');
        engine.debugDisplay.setCustomData('Action', 'CLIQUE SUR L\'ÉCRAN POUR DÉMARRER');

        engine.timeControl.setTPS(60);

        engine.colorPalette.enabled = false;
        if (engine.colorPalette.isOpen) {
            engine.colorPalette.toggle();
        }

        if (engine.timeControl.isPaused) {
            engine.timeControl.togglePause();
        }
    }

    handleInputs(engine) {
        const { mouseState } = engine.inputManager;

        if (mouseState.isDown && !this.streamActive) {
            this.initAudio(engine);
        }
    }

    initAudio(engine) {
        this.streamActive = true;
        engine.debugDisplay.setCustomData('Action', 'Autorise le micro (Popup haut écran)');

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

                this.analyser = this.audioCtx.createAnalyser();
                this.analyser.fftSize = 128;
                this.analyser.smoothingTimeConstant = 0.6;

                const source = this.audioCtx.createMediaStreamSource(stream);
                source.connect(this.analyser);

                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

                engine.debugDisplay.setCustomData('Statut', 'Microphone Actif 🎤');
                engine.debugDisplay.removeCustomData('Action');
            })
            .catch(err => {
                console.error("Erreur Micro :", err);
                engine.debugDisplay.setCustomData('Erreur', 'Microphone refusé/introuvable');
            });
    }

    getParticleColor(type, life, maxLife) {
        const ratio = life / maxLife;
        if (type === 'BASS') {
            return `rgb(${Math.floor(255 * ratio)}, 20, 50)`;
        } else if (type === 'MID') {
            return `rgb(255, ${Math.floor(200 * ratio)}, 0)`;
        } else {
            return `rgb(${Math.floor(255 * ratio)}, 255, 255)`;
        }
    }

    onTick(dt, engine) {
        const activeCells = [];
        const updatedCells = new Set();

        if (this.streamActive && this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);

            const startX = -Math.floor(this.spectrumWidth / 2);
            const groundY = 20;

            for (let i = 0; i < this.spectrumWidth; i++) {
                const volume = this.dataArray[i];

                if (volume > 70) {
                    let type, maxEnergy;
                    if (i < 15) { type = 'BASS'; maxEnergy = Math.floor(volume / 10); }
                    else if (i < 40) { type = 'MID'; maxEnergy = Math.floor(volume / 8); }
                    else { type = 'HIGH'; maxEnergy = Math.floor(volume / 5); }

                    if (!engine.grid.getCell(startX + i, groundY)) {
                        engine.grid.setCell(startX + i, groundY, {
                            type: type,
                            energy: maxEnergy,
                            maxEnergy: maxEnergy,
                            life: 255
                        });
                    }
                }
            }
        }

        for (const chunk of engine.grid.chunks.values()) {
            for (const [localKey, data] of chunk.cells.entries()) {
                if (data.type === 'BASS' || data.type === 'MID' || data.type === 'HIGH') {
                    const [localX, localY] = localKey.split(',').map(Number);
                    activeCells.push({ x: chunk.x * 32 + localX, y: chunk.y * 32 + localY, data });
                }
            }
        }

        activeCells.sort(() => Math.random() - 0.5);

        for (const cell of activeCells) {
            const { x, y, data } = cell;
            if (updatedCells.has(`${x},${y}`)) continue;

            data.life -= (data.type === 'HIGH' ? 6 : 3);

            if (data.life <= 0) {
                engine.grid.setCell(x, y, null);
                continue;
            }

            data.color = this.getParticleColor(data.type, data.life, 255);

            let nextX = x;
            let nextY = y;

            if (data.energy > 0) {
                nextY = y - 1;
                data.energy--;

                if (engine.grid.getCell(x, nextY)) {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    if (!engine.grid.getCell(x + dir, nextY)) {
                        nextX = x + dir;
                    } else if (!engine.grid.getCell(x - dir, nextY)) {
                        nextX = x - dir;
                    } else {
                        engine.grid.setCell(x, y, null);
                        continue;
                    }
                }
            }
            else {
                engine.grid.setCell(x, y, null);
                continue;
            }

            if (nextX !== x || nextY !== y) {
                engine.grid.setCell(nextX, nextY, data);
                engine.grid.setCell(x, y, null);
                updatedCells.add(`${nextX},${nextY}`);
            } else {
                engine.grid.setCell(x, y, data);
            }
        }
    }

    onRender(ctx, camera) {}
}