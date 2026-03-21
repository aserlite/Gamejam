# 🏎️ MoteurVroum

**MoteurVroum** est un moteur de rendu et de simulation 2D modulaire, ultraléger et performant, basé sur une grille infinie. Construit de zéro en Vanilla JavaScript et HTML5 Canvas, il est conçu pour prototyper rapidement des idées génératives (automates cellulaires, génération procédurale, simulations de particules, etc.) sans s'encombrer de bibliothèques lourdes.

---

## ✨ Fonctionnalités Clés

*   ♾️ **Grille Infinie & Chunking :** Le monde est découpé en "Chunks" alloués dynamiquement (Sparse Matrix) pour une consommation mémoire optimisée. Seul ce que vous explorez existe !
*   🚀 **Culling Haute Performance :** Le moteur de rendu ne dessine strictement que les cellules visibles à l'écran. Objectif 60 FPS constant.
*   🎥 **Caméra Mathématique Intégrée :** Déplacement fluide (Pan) et Zoom infini centré sur le curseur, avec conversion transparente entre l'espace "Écran" et l'espace "Monde".
*   🧩 **Architecture Modulaire (Inversion de Contrôle) :** Le cœur du moteur (`/engine`) est totalement indépendant de la logique du jeu (`/projects`). Chargez dynamiquement le projet que vous souhaitez via le menu d'accueil.
*   🔗 **Partage de Création par URL :** Sérialisation instantanée de votre grille en Base64. Partagez votre monde avec un simple lien généré automatiquement !
*   🎨 **Outils Intégrés :** Palette de couleurs, mode édition, gomme, et console de Debug superposée (avec opacité réglable).

---

## 🎮 Contrôles & Raccourcis

| Action | Raccourci |
| :--- | :--- |
| **Déplacer la caméra (Pan)** | `Clic Gauche` (Maintenir & Glisser) |
| **Zoomer / Dézoomer** | `Molette de la souris` |
| **Dessiner / Placer une cellule** | `Shift` + `Clic Gauche` |
| **Ouvrir/Fermer la Palette** | Touche `C` |
| **Afficher/Estomper le Debug** | Touche `D` |
| **Partager le projet (Copier URL)**| Touche `S` |
| **Quitter le projet en cours** | Touche `Échap` (Escape) |


## 🛠️ Créer son propre projet (Règle)

La force de ce moteur réside dans sa simplicité de modding. Pour créer une nouvelle simulation, il vous suffit de créer un fichier dans le dossier `src/projects/`.

1. Dupliquez le fichier `src/rules_templates/BaseRule.js`.
2. Renommez-le et placez-le dans `src/projects/MonSuperProjet.js`.
3. Le projet sera **automatiquement** détecté par le menu d'accueil !

### Cycle de vie d'un projet :
```javascript
export class MonSuperProjet {
    // 1. Appelé une seule fois au chargement
    onInit(engine) {
        engine.debugDisplay.setCustomData('Statut', 'Prêt !');
    }

    // 2. Appelé à chaque frame (Calculs physiques, automates, inputs)
    onTick(dt, engine) {
        // Manipulez la grille ici : engine.grid.setCell(x, y, data)
    }

    // 3. (Optionnel) Appelé après le rendu de la grille pour dessiner des UI/FX par dessus
    onRender(ctx, camera) { }
}
```

---

## 🏗️ Stack Technique
*   **Langage :** Vanilla JavaScript (ES6+ Modules)
*   **Rendu :** API native `<canvas>` (CanvasRenderingContext2D)
*   **Build Tool :** Vite
*   **Zéro dépendance externe** pour la logique et le rendu (pas de Three.js, pas de Pixi.js). Fait maison avec amour ! 💚
