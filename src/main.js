import { Core } from './engine/Core.js';
import { Player } from './AnimoTraversent/Player.js';
import { generateIsland } from './AnimoTraversent/MapGenerator.js';
import { BLOCKS } from './AnimoTraversent/BlockDictionary.js';

window.BLOCKS = BLOCKS;

class IslandCrafter {
    constructor() {
        this.player = new Player(0, 0); 
        this.state = 'INIT'; 
        this.cinematicTime = 0;
        this.introOverlay = null;
        this.hudOverlay = null;
        this.engine = null;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    onReset() {
        localStorage.removeItem('islandCrafter_playedIntro');
        localStorage.removeItem('islandCrafter_player');
        this.player.inventory = { wood: 50 };
        this.state = 'INIT';
    }

    onInit(engine, dataLoaded) {
        this.engine = engine;
        engine.camera.zoom = 2; 
        engine.timeControl.isPaused = false; 

        this.initHUD();

        const hasPlayedIntro = localStorage.getItem('islandCrafter_playedIntro') === 'true';

        // Load Player state
        const savedPlayer = localStorage.getItem('islandCrafter_player');
        if (savedPlayer) {
            try {
                const pData = JSON.parse(savedPlayer);
                if (pData && pData.inventory) {
                    this.player.inventory = pData.inventory;
                }
            } catch(e) {}
        }

        // Force l'actualisation visuelle après chargement des données locales
        this.updateHUD();

        if (dataLoaded && hasPlayedIntro) {
            this.state = 'PLAYING';
            this.hudOverlay.style.display = 'block';
            engine.debugDisplay.setCustomData('Statut', 'Jeu en cours (Chargé)');
        } else {
            generateIsland(engine);
            
            this.state = 'CINEMATIC';
            this.hudOverlay.style.display = 'none';
            this.startCinematic(engine);
        }
    }

    initHUD() {
        this.hudOverlay = document.createElement('div');
        this.hudOverlay.style.position = 'absolute';
        this.hudOverlay.style.bottom = '20px';
        this.hudOverlay.style.left = '50%';
        this.hudOverlay.style.transform = 'translateX(-50%)';
        this.hudOverlay.style.background = 'rgba(0,0,0,0.8)';
        this.hudOverlay.style.color = '#fff';
        this.hudOverlay.style.padding = '10px 20px';
        this.hudOverlay.style.borderRadius = '30px';
        this.hudOverlay.style.fontFamily = 'monospace';
        this.hudOverlay.style.fontSize = '1.2rem';
        this.hudOverlay.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
        this.hudOverlay.style.pointerEvents = 'none';
        this.hudOverlay.style.border = '2px solid rgba(255,255,255,0.1)';
        this.hudOverlay.style.display = 'none'; 
        document.body.appendChild(this.hudOverlay);
        this.updateHUD();
    }

    updateHUD() {
        if (!this.hudOverlay) return;
        const count = this.player.inventory[this.player.selectedBlockId] || 0;
        const blockName = BLOCKS[this.player.selectedBlockId]?.name || 'Rien';
        this.hudOverlay.innerHTML = `🎒 ${blockName}: <b style="color: #f1c40f;">${count}</b>`;
    }

    startCinematic(engine) {
        engine.camera.x = -600;
        engine.camera.y = -600;
        engine.camera.zoom = 1;
        this.cinematicTime = 0;

        this.introOverlay = document.createElement('div');
        this.introOverlay.style.position = 'absolute';
        this.introOverlay.style.top = '0';
        this.introOverlay.style.left = '0';
        this.introOverlay.style.width = '100%';
        this.introOverlay.style.height = '100%';
        this.introOverlay.style.pointerEvents = 'none'; 
        this.introOverlay.style.display = 'flex';
        this.introOverlay.style.alignItems = 'center';
        this.introOverlay.style.justifyContent = 'center';
        
        this.introOverlay.innerHTML = `
            <div style="background: rgba(0,0,0,0.85); color: #fff; padding: 40px; border-radius: 12px; pointer-events: auto; max-width: 500px; text-align: center; font-family: 'Segoe UI', sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(10px); opacity: 0; transition: opacity 2s ease-in-out;" id="cinematic-box">
                <h1 style="color: #f1c40f; margin-bottom: 20px; font-size: 2rem;">Bienvenue sur Island Crafter</h1>
                <p style="font-size: 1.1rem; line-height: 1.5; color: #dfe6e9; margin-bottom: 30px;">
                    Vous venez d'échouer sur une île vierge générée de manière unique.<br><br>
                    Utilisez <b>Z Q S D</b> ou les <b>Flèches</b> pour vous déplacer. Attention à ne pas tomber à l'eau !<br><br>
                    Vous avez du matériel dans votre inventaire pour commencer à aménager l'île.
                </p>
                <button id="skip-intro" style="padding: 12px 24px; background: #0984e3; color: white; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; font-size: 1.1rem; transition: background 0.2s;">Démarrer l'Aventure</button>
            </div>
        `;

        document.body.appendChild(this.introOverlay);
        
        setTimeout(() => {
            const box = document.getElementById('cinematic-box');
            if(box) box.style.opacity = '1';
        }, 500);

        document.getElementById('skip-intro').addEventListener('click', () => {
            this.endCinematic(engine);
        });
    }

    endCinematic(engine) {
        if (this.introOverlay) {
            this.introOverlay.style.opacity = '0';
            setTimeout(() => {
                if(this.introOverlay) this.introOverlay.remove();
                this.introOverlay = null;
            }, 1000);
        }
        
        localStorage.setItem('islandCrafter_playedIntro', 'true');
        engine.storageManager.save(); 
        
        this.state = 'PLAYING';
        this.hudOverlay.style.display = 'block';
        engine.camera.zoom = 2; 
        engine.debugDisplay.setCustomData('Statut', 'Jeu en cours');
    }

    handleInputs(engine) {
        // Ignorer l'ancien système de souris
    }

    handleKeyDown(e) {
        if (this.state !== 'PLAYING' || !this.engine) return;

        if (e.code === 'Space') {
            e.preventDefault(); // Eviter scroll de la page
            this.tryPlaceBlock();
        }
    }

    tryPlaceBlock() {
        const targetX = this.player.x + this.player.facingX * this.engine.cellSize;
        const targetY = this.player.y + this.player.facingY * this.engine.cellSize;

        const cellX = Math.floor(targetX / this.engine.cellSize);
        const cellY = Math.floor(targetY / this.engine.cellSize);

        const activeBlockId = this.player.selectedBlockId;
        const currentCell = this.engine.grid.getCell(cellX, cellY);
        
        // Retirer un pont existant et rendre le rondin de bois
        if (currentCell && currentCell.id === activeBlockId) {
            // Analyse de l'environnement pour déduire la profondeur originale
            let deepCount = 0;
            const neighbors = [
                this.engine.grid.getCell(cellX - 1, cellY),
                this.engine.grid.getCell(cellX + 1, cellY),
                this.engine.grid.getCell(cellX, cellY - 1),
                this.engine.grid.getCell(cellX, cellY + 1)
            ];
            
            for (let n of neighbors) {
                if (n && (n.id === 'deep_water' || n.id === 'abyss')) {
                    deepCount++;
                }
            }

            // Si au moins 2 voisins sont profonds, on déduit qu'on était en eau profonde
            const restoredBlock = deepCount >= 2 ? BLOCKS.deep_water : BLOCKS.water;

            this.engine.grid.setCell(cellX, cellY, restoredBlock);
            this.player.inventory[activeBlockId]++;
            this.savePlayer();
            this.updateHUD();
            return;
        }

        const hasBlock = this.player.inventory[activeBlockId] > 0;
        
        if (hasBlock && (!currentCell || currentCell.id !== activeBlockId)) {
            const blockObj = BLOCKS[activeBlockId];
            
            if (blockObj.placeable) {
                // Restriction logic: Only let the player build bridges (wood) on water!
                const isWater = currentCell && (currentCell.id === 'water' || currentCell.id === 'deep_water');
                
                if (activeBlockId === 'wood' && (!isWater)) {
                    return; // Annuler si on n'est pas sur de l'eau
                }

                this.engine.grid.setCell(cellX, cellY, blockObj);
                this.player.inventory[activeBlockId]--;
                this.savePlayer();
                this.updateHUD();
            }
        }
    }

    savePlayer() {
        localStorage.setItem('islandCrafter_player', JSON.stringify({
            inventory: this.player.inventory
        }));
    }

    onTick(dt, engine) {
        if (this.state === 'CINEMATIC') {
            this.cinematicTime += dt;
            
            const targetCamX = engine.canvas.width / 2 - this.player.x * engine.camera.zoom;
            const targetCamY = engine.canvas.height / 2 - this.player.y * engine.camera.zoom;
            
            engine.camera.x += (targetCamX - engine.camera.x) * (dt * 0.4);
            engine.camera.y += (targetCamY - engine.camera.y) * (dt * 0.4);

            if (engine.camera.zoom < 2) {
                engine.camera.zoom += dt * 0.05;
            }

            engine.debugDisplay.setCustomData('Statut', 'Cinématique en cours');

        } else if (this.state === 'PLAYING') {
            
            this.player.update(dt, engine.inputManager, engine.grid, engine.cellSize);
            
            const targetCamX = engine.canvas.width / 2 - this.player.x * engine.camera.zoom;
            const targetCamY = engine.canvas.height / 2 - this.player.y * engine.camera.zoom;
            
            engine.camera.x += (targetCamX - engine.camera.x) * 0.1;
            engine.camera.y += (targetCamY - engine.camera.y) * 0.1;

            engine.debugDisplay.setCustomData('Player X', Math.floor(this.player.x));
            engine.debugDisplay.setCustomData('Player Y', Math.floor(this.player.y));
        }
    }

    onRender(ctx, camera) {
        this.player.draw(ctx);
    }
}

const appElement = document.getElementById('app');
if (appElement) {
    appElement.style.display = 'none';
}

const engine = new Core('engine-canvas');
engine.loadProject(new IslandCrafter(), 'IslandCrafter');
engine.start();
