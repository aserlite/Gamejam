import { generateIsland } from './MapGenerator.js';

export class UIManager {
    constructor(app) {
        this.app = app;
        this.menuOverlay = null;
        this.introOverlay = null;
        this.hudOverlay = null;
    }

    initHUD() {
        const oldDom = document.getElementById('animo-hud');
        if (oldDom) oldDom.remove();

        this.hudOverlay = document.createElement('div');
        this.hudOverlay.id = 'animo-hud';
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

        const hotbar = this.app.player.hotbar || [];
        const selectedSlot = this.app.player.selectedSlot || 0;

        const rawWood = this.app.player.inventory['wood'] || 0;
        const rawStone = this.app.player.inventory['stone'] || 0;

        let html = `<div style="text-align: center; margin-bottom: 12px; font-size: 1rem; color: #dfe6e9; padding: 5px; border-radius: 8px;">
            🌲 Bois : <span style="color: #f1c40f; font-weight: bold; font-size: 1.2rem;">${rawWood}</span> &nbsp;|&nbsp; 
            🪨 Pierre : <span style="color: #bdc3c7; font-weight: bold; font-size: 1.2rem;">${rawStone}</span>
        </div>`;

        html += '<div style="font-size:1rem; display: flex; gap: 8px; justify-content: center; align-items: flex-end;">';
        
        hotbar.forEach((itemId, index) => {
            const isSelected = (index === selectedSlot);
            const blockName = window.BLOCKS[itemId] ? window.BLOCKS[itemId].name : itemId;
            
            let costLabel = '';
            let canAfford = true;

            if (itemId === 'wood' || itemId === 'wood_wall') {
                costLabel = "Coût: 1 Bois";
                canAfford = rawWood >= 1;
            } else if (itemId === 'campfire') {
                costLabel = "1 B. + 1 P.";
                canAfford = (rawWood >= 1 && rawStone >= 1);
            } else if (itemId === 'empty_hand') {
                costLabel = "Aucun";
                canAfford = true;
            } else if (itemId === 'house_door') {
                const count = this.app.player.inventory['house_door'] || 0;
                costLabel = `${count} dispo.`;
                canAfford = count >= 1;
            }

            const bg = isSelected ? 'rgba(241, 196, 15, 0.25)' : 'rgba(0, 0, 0, 0.6)';
            const border = isSelected ? '2px solid #f1c40f' : '2px solid rgba(255,255,255,0.1)';
            const opacity = canAfford ? '1' : '0.4';
            const titleColor = isSelected ? '#f1c40f' : '#ecf0f1';
            
            html += `
                <div style="background: ${bg}; border: ${border}; opacity: ${opacity}; padding: 6px 12px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; min-width: 80px; transition: 0.2s;">
                    <span style="font-size: 0.65rem; color: #7f8c8d; margin-bottom: 2px;">[Touche ${index + 1}]</span>
                    <span style="font-size: 0.8rem; text-transform: uppercase; font-weight: bold; color: ${titleColor}; margin-bottom: 4px;">${blockName}</span>
                    <span style="font-size: 0.7rem; color: #95a5a6; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px;">${costLabel}</span>
                </div>
            `;
        });
        
        html += '</div>';
        this.hudOverlay.innerHTML = html;
    }

    showLobby(dataLoaded) {
        this.app.state = 'MENU';
        this.app.engine.camera.zoom = 0.5;

        const oldDom = document.getElementById('animo-menu');
        if (oldDom) oldDom.remove();

        this.menuOverlay = document.createElement('div');
        this.menuOverlay.id = 'animo-menu';
        this.menuOverlay.style.position = 'absolute';
        this.menuOverlay.style.top = '0';
        this.menuOverlay.style.left = '0';
        this.menuOverlay.style.width = '100%';
        this.menuOverlay.style.height = '100%';
        this.menuOverlay.style.display = 'flex';
        this.menuOverlay.style.flexDirection = 'column';
        this.menuOverlay.style.justifyContent = 'center';
        this.menuOverlay.style.alignItems = 'center';
        this.menuOverlay.style.background = 'rgba(0, 0, 0, 0.7)';
        this.menuOverlay.style.backdropFilter = 'blur(5px)';
        this.menuOverlay.style.color = 'white';
        this.menuOverlay.style.fontFamily = "'Segoe UI', sans-serif";
        this.menuOverlay.style.zIndex = '100';

        this.menuOverlay.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 2rem; color: #f1c40f;">AnimoTraversent Online</h1>
            <div style="display: flex; gap: 20px;">
                <div style="background: rgba(46, 204, 113, 0.2); padding: 30px; border-radius: 12px; border: 2px solid #2ecc71; text-align: center; width: 250px;">
                    <h3>🌍 Héberger une Île</h3>
                    <p style="font-size: 0.9rem; color: #ccc;">Créez votre propre île et invitez des amis.</p>
                    <button id="btn-host" style="margin-top: 15px; padding: 10px 20px; font-size: 1.1rem; background: #2ecc71; color: white; border: none; border-radius: 5px; cursor: pointer;">Générer</button>
                    <p id="host-code-display" style="margin-top: 15px; font-weight: bold; color: #f1c40f; display: none;"></p>
                </div>
                <div style="background: rgba(52, 152, 219, 0.2); padding: 30px; border-radius: 12px; border: 2px solid #3498db; text-align: center; width: 250px;">
                    <h3>🔌 Rejoindre une Île</h3>
                    <p style="font-size: 0.9rem; color: #ccc;">Connectez-vous à l'île d'un ami via son code.</p>
                    <input type="text" id="join-code" placeholder="Code de l'Hôte" style="margin-top: 15px; padding: 10px; width: 80%; text-align: center; border-radius: 5px; border: none;">
                    <button id="btn-join" style="margin-top: 10px; padding: 10px 20px; font-size: 1.1rem; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Rejoindre</button>
                    <p id="join-status" style="margin-top: 10px; color: #e74c3c; font-size: 0.9rem;"></p>
                </div>
            </div>
            <button id="btn-solo" style="margin-top: 40px; background: transparent; color: #aaa; border: none; cursor: pointer; text-decoration: underline;">Jouer en Solo (Offline)</button>
        `;

        document.body.appendChild(this.menuOverlay);
        this.setupLobbyHooks(dataLoaded);
    }

    setupLobbyHooks(dataLoaded) {
        document.getElementById('btn-solo').addEventListener('click', () => {
            this.app.network.isHost = true;
            if (!dataLoaded) generateIsland(this.app.engine);
            this.app.startGameProcess(false);
        });

        const btnHost = document.getElementById('btn-host');
        const codeDisplay = document.getElementById('host-code-display');
        
        btnHost.addEventListener('click', () => {
            btnHost.innerText = "Initialisation...";
            btnHost.disabled = true;
            this.app.network.startHost((roomCode) => {
                codeDisplay.style.display = 'block';
                codeDisplay.innerHTML = `Code Île:<br><span style="user-select: all; background: #222; padding: 5px; border-radius: 4px; display: inline-block; margin-top: 5px;">${roomCode}</span>`;
                btnHost.innerText = "Serveur Ouvert !";
                
                if (!dataLoaded) generateIsland(this.app.engine);
                
                const startBtn = document.createElement('button');
                startBtn.innerText = "Jouer sur mon Serveur";
                startBtn.style.cssText = "display:block; margin: 15px auto 0; padding: 5px 15px; background: #f1c40f; color: #111; border: none; border-radius: 4px; cursor:pointer;";
                startBtn.onclick = () => this.app.startGameProcess(false);
                codeDisplay.appendChild(startBtn);
            });
        });

        const btnJoin = document.getElementById('btn-join');
        const inputCode = document.getElementById('join-code');
        const statusDisplay = document.getElementById('join-status');
        
        btnJoin.addEventListener('click', () => {
            const hostId = inputCode.value.trim();
            if (!hostId) return;
            
            btnJoin.innerText = "Connexion...";
            btnJoin.disabled = true;
            statusDisplay.innerText = "";

            this.app.network.joinHost(hostId, () => {
                btnJoin.innerText = "Connecté ! Attente de la Carte...";
            }, (err) => {
                btnJoin.innerText = "Rejoindre";
                btnJoin.disabled = false;
                statusDisplay.innerText = "Erreur de connexion.";
            });
        });
    }

    startCinematic() {
        this.app.engine.camera.x = -600;
        this.app.engine.camera.y = -600;
        this.app.engine.camera.zoom = 1;
        this.app.cinematicTime = 0;

        const oldDom = document.getElementById('animo-cinematic');
        if (oldDom) oldDom.remove();

        this.introOverlay = document.createElement('div');
        this.introOverlay.id = 'animo-cinematic';
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
                <h1 style="color: #f1c40f; margin-bottom: 20px; font-size: 2rem;">Bienvenue sur AnimoTraversent</h1>
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
            this.endCinematic();
        });
    }

    endCinematic() {
        if (this.introOverlay) {
            this.introOverlay.style.opacity = '0';
            setTimeout(() => {
                if(this.introOverlay) this.introOverlay.remove();
                this.introOverlay = null;
            }, 1000);
        }
        
        localStorage.setItem('islandCrafter_playedIntro', 'true');
        this.app.engine.storageManager.save(); 
        
        this.app.state = 'PLAYING';
        this.hudOverlay.style.display = 'block';
        this.app.engine.camera.zoom = 2; 
        this.app.engine.debugDisplay.setCustomData('Statut', 'Jeu en cours');
    }

    destroyLobby() {
        if (this.menuOverlay) {
            this.menuOverlay.remove();
            this.menuOverlay = null;
        }
    }
}
