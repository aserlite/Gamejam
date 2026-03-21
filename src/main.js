import { Core } from './engine/Core.js';
import { Player } from './AnimoTraversent/Player.js';
import { BLOCKS } from './AnimoTraversent/BlockDictionary.js';
import { NetworkManager } from './AnimoTraversent/NetworkManager.js';
import { UIManager } from './AnimoTraversent/UIManager.js';
import { generateHouseRegion } from './AnimoTraversent/HouseGenerator.js';

window.BLOCKS = BLOCKS;

class IslandCrafter {
    constructor() {
        this.player = new Player(0, 0); 
        this.state = 'MENU'; 
        this.cinematicTime = 0;
        
        this.harvestTimer = 0;
        this.isHarvesting = false;
        this.targetHarvestX = -1;
        this.targetHarvestY = -1;

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
        this.player.inventory = { wood: 0, stone: 0, wood_wall: 0, house_door: 1 };
        this.player.hotbar = ['empty_hand', 'wood', 'wood_wall', 'campfire', 'house_door'];
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

        if ((this.player.inventory['house_door'] || 0) <= 0) {
            this.player.hotbar = this.player.hotbar.filter(id => id !== 'house_door');
            if (this.player.selectedSlot >= this.player.hotbar.length) {
                this.player.selectedSlot = Math.max(0, this.player.hotbar.length - 1);
            }
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

        const keyMap = {
            'Digit1': 0, 'Numpad1': 0,
            'Digit2': 1, 'Numpad2': 1,
            'Digit3': 2, 'Numpad3': 2,
            'Digit4': 3, 'Numpad4': 3,
            'Digit5': 4, 'Numpad5': 4
        };

        if (keyMap[e.code] !== undefined) {
            this.player.selectedSlot = keyMap[e.code];
            this.ui.updateHUD();
        }
    }

    tryPlaceBlock() {
        const targetX = this.player.x + this.player.facingX * this.engine.cellSize;
        const targetY = this.player.y + this.player.facingY * this.engine.cellSize;

        const cellX = Math.floor(targetX / this.engine.cellSize);
        const cellY = Math.floor(targetY / this.engine.cellSize);

        const activeBlockId = this.player.selectedBlockId;
        const currentCell = this.engine.grid.getCell(cellX, cellY);

        if (currentCell && currentCell.interactable) {
            if (currentCell.teleport === 'inside') {
                this.lastOverworldX = this.player.x;
                this.lastOverworldY = this.player.y;
                
                const hx = 10000;
                const hy = 10000;
                generateHouseRegion(this.engine, hx, hy);
                
                this.player.x = hx * this.engine.cellSize;
                this.player.y = (hy + 4) * this.engine.cellSize;
                
                this.engine.camera.x = this.engine.canvas.width / 2 - this.player.x * this.engine.camera.zoom;
                this.engine.camera.y = this.engine.canvas.height / 2 - this.player.y * this.engine.camera.zoom;
                return;
            } else if (currentCell.teleport === 'outside') {
                this.player.x = this.lastOverworldX || 0;
                this.player.y = this.lastOverworldY || 0;
                this.engine.camera.x = this.engine.canvas.width / 2 - this.player.x * this.engine.camera.zoom;
                this.engine.camera.y = this.engine.canvas.height / 2 - this.player.y * this.engine.camera.zoom;
                return;
            }
        }
        
        if (currentCell && currentCell.harvestable) {
            return;
        }

        let costWood = 0;
        let costStone = 0;
        let isSpecial = false;

        if (activeBlockId === 'wood' || activeBlockId === 'wood_wall') {
            costWood = 1;
        } else if (activeBlockId === 'campfire') {
            costWood = 1;
            costStone = 1;
        } else if (activeBlockId === 'house_door') {
            isSpecial = true;
        }

        if (currentCell && currentCell.id === activeBlockId) {
            let restoredBlock;
            
            if (activeBlockId === 'wood') {
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
                restoredBlock = deepCount >= 2 ? BLOCKS.deep_water : BLOCKS.water;
            } else if (['wood_wall', 'plank_floor', 'house_door', 'campfire'].includes(activeBlockId)) {
                restoredBlock = (cellX > 1000) ? BLOCKS.plank_floor : BLOCKS.grass;
            } else {
                return;
            }

            this.engine.grid.setCell(cellX, cellY, restoredBlock);

            this.network.broadcast({
                type: 'action',
                payload: { action: 'placeBlock', x: cellX, y: cellY, blockId: restoredBlock.id }
            }, []);

            if (isSpecial) {
                this.player.inventory[activeBlockId] = (this.player.inventory[activeBlockId] || 0) + 1;
            } else {
                if (costWood > 0) this.player.inventory['wood'] = (this.player.inventory['wood'] || 0) + 1;
                if (costStone > 0) this.player.inventory['stone'] = (this.player.inventory['stone'] || 0) + 1;
            }

            this.savePlayer();
            this.ui.updateHUD();
            return;
        }

        let hasBlock = true;
        if (isSpecial) {
            hasBlock = (this.player.inventory[activeBlockId] > 0);
        } else {
            if (costWood > 0 && (this.player.inventory['wood'] || 0) < costWood) hasBlock = false;
            if (costStone > 0 && (this.player.inventory['stone'] || 0) < costStone) hasBlock = false;
        }
        
        if (hasBlock && (!currentCell || currentCell.id !== activeBlockId)) {
            const blockObj = BLOCKS[activeBlockId];
            
            if (blockObj.placeable) {
                const isWater = currentCell && (currentCell.id === 'water' || currentCell.id === 'deep_water');
                
                if (activeBlockId === 'wood' && (!isWater)) {
                    return;
                }

                if (activeBlockId === 'wood_wall' || activeBlockId === 'campfire') {
                    const validFloors = ['grass', 'sand', 'plank_floor'];
                    if (!currentCell || !validFloors.includes(currentCell.id)) {
                        return;
                    }
                }

                if (activeBlockId === 'house_door') {
                    let canBuild = true;
                    const offsets = [
                        { dx: 0, dy: -3 },
                        { dx: -1, dy: -2 }, { dx: 0, dy: -2 }, { dx: 1, dy: -2 },
                        { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
                        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                    ];
                    for (let off of offsets) {
                        const cell = this.engine.grid.getCell(cellX + off.dx, cellY + off.dy);
                        if (cell && (cell.solid || cell.id === 'water' || cell.id === 'deep_water' || cell.id === 'abyss')) {
                            canBuild = false; break;
                        }
                    }
                    if (!canBuild) return;

                    this.engine.grid.setCell(cellX, cellY, blockObj);
                    for (let off of offsets) {
                        this.engine.grid.setCell(cellX + off.dx, cellY + off.dy, BLOCKS.house_structure);
                        this.network.broadcast({
                            type: 'action',
                            payload: { action: 'placeBlock', x: cellX + off.dx, y: cellY + off.dy, blockId: 'house_structure' }
                        }, []);
                    }
                } else {
                    this.engine.grid.setCell(cellX, cellY, blockObj);
                }

                this.network.broadcast({
                    type: 'action',
                    payload: { action: 'placeBlock', x: cellX, y: cellY, blockId: blockObj.id }
                }, []);

                if (isSpecial) {
                    this.player.inventory[activeBlockId]--;
                    if (activeBlockId === 'house_door' && this.player.inventory['house_door'] <= 0) {
                        this.player.hotbar = this.player.hotbar.filter(id => id !== 'house_door');
                        if (this.player.selectedSlot >= this.player.hotbar.length) {
                            this.player.selectedSlot = Math.max(0, this.player.hotbar.length - 1);
                        }
                    }
                } else {
                    if (costWood > 0) this.player.inventory['wood']--;
                    if (costStone > 0) this.player.inventory['stone']--;
                }

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
            
            const isSpaceDown = engine.inputManager.isKeyDown('Space') || engine.inputManager.isKeyDown('Spacebar');
            const targetX = this.player.x + this.player.facingX * engine.cellSize;
            const targetY = this.player.y + this.player.facingY * engine.cellSize;
            const cellX = Math.floor(targetX / engine.cellSize);
            const cellY = Math.floor(targetY / engine.cellSize);
            const currentCell = engine.grid.getCell(cellX, cellY);

            let executingHarvest = false;

            if (isSpaceDown && currentCell && currentCell.harvestable && this.player.selectedBlockId === 'empty_hand') {
                if (this.targetHarvestX !== cellX || this.targetHarvestY !== cellY) {
                    this.targetHarvestX = cellX;
                    this.targetHarvestY = cellY;
                    this.harvestTimer = 0;
                }
                this.isHarvesting = true;
                this.harvestTimer += dt;
                
                if (this.harvestTimer >= 0.6) {
                    executingHarvest = true;
                    this.isHarvesting = false;
                    this.harvestTimer = 0;
                }
            } else {
                this.isHarvesting = false;
                this.harvestTimer = 0;
                this.targetHarvestX = -1;
                this.targetHarvestY = -1;
            }

            if (executingHarvest) {
                const dropId = currentCell.drops;
                const amount = currentCell.dropAmount || 1;
                this.player.inventory[dropId] = (this.player.inventory[dropId] || 0) + amount;
                engine.grid.setCell(cellX, cellY, BLOCKS[currentCell.floor]);
                
                this.network.broadcast({
                    type: 'action',
                    payload: { action: 'placeBlock', x: cellX, y: cellY, blockId: currentCell.floor }
                }, []);
                
                this.savePlayer();
                this.ui.updateHUD();
            }

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
        const view = this.engine.getViewport();
        for (let x = view.startCol; x <= view.endCol; x++) {
            for (let y = view.startRow; y <= view.endRow; y++) {
                const cell = this.engine.grid.getCell(x, y);
                if (cell && cell.id === 'house_door') {
                    const cx = x * this.engine.cellSize;
                    const cy = y * this.engine.cellSize;
                    const cs = this.engine.cellSize;

                    ctx.fillStyle = '#ecf0f1';
                    ctx.fillRect(cx - cs, cy - cs, cs * 3, cs * 2);
                    
                    ctx.fillStyle = cell.color;
                    ctx.fillRect(cx, cy, cs, cs);
                    
                    ctx.fillStyle = '#c0392b';
                    ctx.beginPath();
                    ctx.moveTo(cx - cs * 1.5, cy - cs);
                    ctx.lineTo(cx + cs * 2.5, cy - cs);
                    ctx.lineTo(cx + cs * 0.5, cy - cs * 3);
                    ctx.fill();

                    ctx.fillStyle = '#7f8c8d';
                    ctx.fillRect(cx + cs * 0.1, cy + cs, cs * 0.8, cs * 0.3);
                }
            }
        }

        this.player.draw(ctx);
        for (const peerId in this.remotePlayers) {
            this.remotePlayers[peerId].draw(ctx);
        }

        if (this.state === 'PLAYING' && this.isHarvesting && this.targetHarvestX !== -1) {
            const px = this.targetHarvestX * this.engine.cellSize;
            const py = this.targetHarvestY * this.engine.cellSize;

            const shakeX = (Math.random() - 0.5) * 4;
            const shakeY = (Math.random() - 0.5) * 4;

            const cell = this.engine.grid.getCell(this.targetHarvestX, this.targetHarvestY);
            if (cell) {
                ctx.fillStyle = cell.color;
                ctx.fillRect(px + shakeX, py + shakeY, this.engine.cellSize, this.engine.cellSize);
            }

            const progress = Math.min(1, this.harvestTimer / 0.6);
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(px, py - 10, this.engine.cellSize, 8);
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(px + 1, py - 9, (this.engine.cellSize - 2) * progress, 6);
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
