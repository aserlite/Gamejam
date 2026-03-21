/**
 * Template de base pour la création d'un projet/règle.
 * Ce fichier ne doit pas être modifié directement.
 * Copiez-le dans le dossier /src/projects/ et renommez la classe.
 */
export class BaseRule {
    constructor() {
        // Initialisez ici les variables d'état, dictionnaires ou palettes
        // ex: this.materials = { ... };
    }

    /**
     * Appelé une seule fois au chargement du projet ou lors d'un Reset (Touche R).
     * @param {Object} engine - L'instance du moteur principal (Core)
     * @param {boolean} dataLoaded - True si une sauvegarde vient d'être chargée.
     */
    onInit(engine, dataLoaded) {
        // Configuration de l'UI
        // engine.debugDisplay.setCustomData('Projet', 'Nouveau Projet');

        // Si aucune sauvegarde n'a été chargée, on génère le monde par défaut
        if (!dataLoaded) {
            // engine.grid.setCell(0, 0, { type: 'WALL' });
        }
    }

    /**
     * Appelé à chaque frame (60 fois par seconde en général).
     * Gère UNIQUEMENT les interactions utilisateur (clavier/souris).
     * @param {Object} engine - L'instance du moteur principal
     */
    handleInputs(engine) {
        // const { inputManager, camera, grid, cellSize } = engine;
        // const { mouseState } = inputManager;

        // if (mouseState.isDown && !mouseState.shiftKey) {
        //     const worldPos = camera.screenToWorld(mouseState.screenX, mouseState.screenY);
        //     const cellX = Math.floor(worldPos.x / cellSize);
        //     const cellY = Math.floor(worldPos.y / cellSize);
        //     grid.setCell(cellX, cellY, { color: '#ff0000' });
        // }
    }

    /**
     * Appelé par le TimeControl. Peut tourner à une vitesse différente du rendu.
     * C'est ici que réside la simulation physique ou les automates cellulaires.
     * @param {number} dt - L'intervalle de tick (tickInterval)
     * @param {Object} engine - L'instance du moteur principal
     */
    onTick(dt, engine) {
        // 1. Récupérer les cellules actives
        // 2. Appliquer les règles
        // 3. Mettre à jour la grille
    }

    /**
     * Appelé à chaque frame après le rendu de la grille par le moteur.
     * @param {CanvasRenderingContext2D} ctx - Le contexte du canvas (déjà transformé)
     * @param {Object} camera - L'instance de la caméra
     */
    onRender(ctx, camera) {
        // Dessiner des effets spéciaux, de la lumière ou des UI par-dessus la grille
    }
}