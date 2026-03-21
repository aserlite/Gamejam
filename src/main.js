import { Core } from './engine/Core.js';
import { Player } from './AnimoTraversent/Player.js';
import { BLOCKS } from './AnimoTraversent/BlockDictionary.js';
import { NetworkManager } from './AnimoTraversent/NetworkManager.js';
import { UIManager } from './AnimoTraversent/UIManager.js';

window.BLOCKS = BLOCKS;

class IslandCrafter {
    constructor() {
        this.player = new Player(0, 0); 
        this.state = 'MENU'; 
        this.cinematicTime = 0;
        this.engine = null;
        this.network = new NetworkManager();
        this.remotePlayers = {};
        this.ui = new UIManager(this);

        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    onReset() {
        localStorage.removeItem('islandCrafter_playedIntro');
        localStorage.removeItem('islandCrafter_player');
        this.player.inventory = { wood: 0, stone: 0 };
        this.state = 'INIT';
    }

    onInit(engine, dataLoaded) {
        this.engine = engine;
        engine.camera.zoom = 2; 
        engine.timeControl.isPaused = false; 

        this.ui.initHUD();

        const hasPlayedIntro = localStorage.getItem('islandCrafter_playedIntro') === 'true';

        const savedPlayer = localStorage.getItem('islandCrafter_player');
        if (savedPlayer) {
            try {
                const pData = JSON.parse(savedPlayer);
                if (pData && pData.inventory) {
                    this.player.inventory = pData.inventory;
                }
            } catch(e) {}
        }

        this.ui.updateHUD();
        this.ui.showLobby(dataLoaded);
        this.setupCoreNetworking();
    }

    setupCoreNetworking() {
        this.network.onPlayerJoined = (peerId) => {
            if (this.network.isHost) {
                const mapPayload = this.engine.grid.serialize();
                this.network.broadcast({ type: 'mapSync', payload: mapPayload }, []);
            }
        };

        this.network.onMapReceived = (mapPayload) => {
            if (!this.network.isHost) {
                this.engine.grid.chunks.clear(); 
                this.engine.grid.deserialize(mapPayload);
                this.startGameProcess(true);
            }
        };

        this.network.onPlayerMoved = (peerId, payload) => {
            if (!this.remotePlayers[peerId]) {
                this.remotePlayers[peerId] = new Player(payload.x, payload.y);
                this.remotePlayers[peerId].color = '#e74c3c';
            }
            this.remotePlayers[peerId].x = payload.x;
            this.remotePlayers[peerId].y = payload.y;
            this.remotePlayers[peerId].facingX = payload.facingX;
            this.remotePlayers[peerId].facingY = payload.facingY;
        };

        this.network.onActionReceived = (peerId, payload) => {
            const { action, x, y, blockId } = payload;
            if (action === 'placeBlock' && BLOCKS[blockId]) {
                this.engine.grid.setCell(x, y, BLOCKS[blockId]);
            }
        };

        this.network.onPlayerLeft = (peerId) => {
            delete this.remotePlayers[peerId];
        };
    }

    startGameProcess(isGuestAndConnected) {
        this.ui.destroyLobby();
        this.engine.camera.zoom = 2;
        
        const hasPlayedIntro = localStorage.getItem('islandCrafter_playedIntro') === 'true';

        if (hasPlayedIntro || isGuestAndConnected) {
            this.state = 'PLAYING';
            this.ui.hudOverlay.style.display = 'block';
            this.engine.debugDisplay.setCustomData('Statut', 'Jeu en cours');
        } else {
            this.state = 'CINEMATIC';
            this.ui.hudOverlay.style.display = 'none';
            this.ui.startCinematic();
        }
    }

    handleInputs(engine) {
    }

    handleKeyDown(e) {
        if (this.state !== 'PLAYING' || !this.engine) return;

        if (e.code === 'Space') {
            e.preventDefault();
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
        
        if (currentCell && currentCell.harvestable) {
            const dropId = currentCell.drops;
            const amount = currentCell.dropAmount || 1;
            
            this.player.inventory[dropId] = (this.player.inventory[dropId] || 0) + amount;
            this.engine.grid.setCell(cellX, cellY, BLOCKS[currentCell.floor]);
            
            this.network.broadcast({
                type: 'action',
                payload: { action: 'placeBlock', x: cellX, y: cellY, blockId: currentCell.floor }
            }, []);

            this.savePlayer();
            this.ui.updateHUD();
            return;
        }

        if (currentCell && currentCell.id === activeBlockId) {
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

            const restoredBlock = deepCount >= 2 ? BLOCKS.deep_water : BLOCKS.water;

            this.engine.grid.setCell(cellX, cellY, restoredBlock);

            this.network.broadcast({
                type: 'action',
                payload: { action: 'placeBlock', x: cellX, y: cellY, blockId: restoredBlock.id }
            }, []);

            this.player.inventory[activeBlockId]++;
            this.savePlayer();
            this.ui.updateHUD();
            return;
        }

        const hasBlock = this.player.inventory[activeBlockId] > 0;
        
        if (hasBlock && (!currentCell || currentCell.id !== activeBlockId)) {
            const blockObj = BLOCKS[activeBlockId];
            
            if (blockObj.placeable) {
                const isWater = currentCell && (currentCell.id === 'water' || currentCell.id === 'deep_water');
                
                if (activeBlockId === 'wood' && (!isWater)) {
                    return;
                }

                this.engine.grid.setCell(cellX, cellY, blockObj);

                this.network.broadcast({
                    type: 'action',
                    payload: { action: 'placeBlock', x: cellX, y: cellY, blockId: blockObj.id }
                }, []);

                this.player.inventory[activeBlockId]--;
                this.savePlayer();
                this.ui.updateHUD();
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
            
            this.networkSyncTimer = (this.networkSyncTimer || 0) + dt;
            if (this.networkSyncTimer > 0.05) {
                if (this.player.x !== this.lastSentX || this.player.y !== this.lastSentY || 
                    this.player.facingX !== this.lastSentFacingX || this.player.facingY !== this.lastSentFacingY) {
                    
                    this.network.broadcast({
                        type: 'playerMoved',
                        payload: {
                            x: this.player.x,
                            y: this.player.y,
                            facingX: this.player.facingX,
                            facingY: this.player.facingY
                        }
                    }, []);
                    
                    this.lastSentX = this.player.x;
                    this.lastSentY = this.player.y;
                    this.lastSentFacingX = this.player.facingX;
                    this.lastSentFacingY = this.player.facingY;
                }
                this.networkSyncTimer = 0;
            }

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
        for (const peerId in this.remotePlayers) {
            this.remotePlayers[peerId].draw(ctx);
        }
    }
}

const appElement = document.getElementById('app');
if (appElement) {
    appElement.style.display = 'none';
}

const engine = new Core('engine-canvas');
engine.loadProject(new IslandCrafter(), 'IslandCrafter');
engine.start();
