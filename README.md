# AnimoTraversent 🏝️

**AnimoTraversent** est un jeu navigateur 2D de type *Animal Crossing-like* axé sur l'exploration et le craft, codé en **Vanilla JavaScript**. Il s'appuie sur le moteur fait maison "Moteur Vroum", basé sur une grille spatiale optimisée par pré-rendu de chunks virtuels (`OffscreenCanvas`).

![Game Preview](./public/icon.webp)

## 🎮 Jouer
Pour démarrer le mode développement local avec Vite :
```bash
npm install
npm run dev
```

## ✨ Fonctionnalités Principales

### 🗺️ Génération Procédurale (Bruit Fractal)
* **Masque Continental** : L'algorithme mathématique garantit l'apparition d'un point de spawn sécurisé (une massive île centrale) avant de s'étendre en îles adjacentes et en lacs.
* **Archipels Naturels** : L'injection de Bruit de Perlin (3 couches simultanées `SimplexNoise`) crée des rivages accidentés, des îlots et des lacs intérieurs organiques.
* **Biomes Dynamiques** : Abysse, Eau Profonde, Eau, Sable, et Herbe fusionnent la carte selon la topologie.

### 🎒 Survie & Construction Directionnelle
* **Physique & Collision** : Le joueur est équipé d'une hitbox glissante et réagit physiquement aux blocs taggés comme solides (L'eau de mer agit comme un mur naturel).
* **Construction Clavier** : Fini le God Mode à la souris. Le joueur doit faire face à une tuile vide (orientée Haut/Bas/Gauche/Droite) et utiliser la barre **Espace** de son clavier pour jeter un de ses 50 ponts de bois !
* **Système Intelligent** : Vous pouvez détruire vos ponts existants et récupérer le bois si l'inventaire vient à manquer. La profondeur originale de l'eau écrasée sera parfaitement restaurée.

### 💾 Sauvegarde Ultra-Légère 
* **Compression IDs** : Une carte procédurale géante contient facilement plus de 22 000 blocs de grilles. Le système de sauvegarde a été retravaillé pour compresser les tuiles en de minuscules dictionnaires `{ i: 'grass' }`, prévenant les surcharges de `localStorage` (`QuotaExceededError`).
* **Persistance Totale** : Si vous fermez et revenez au jeu le lendemain, votre configuration d'île exacte, et le contenu de votre sac à dos (Bois) seront restaurés au grain près.

## ⌨️ Raccourcis & Contrôles

* **Z Q S D / Flèches** : Se déplacer et s'orienter.
* **Espace** : Placer un Pont sur l'eau (ou le détruire / ramasser si la tuile contient déjà un pont).
* **H** : Afficher/Masquer le panneau UI de Debugging.
* **Backspace / Supprimer** : Réinitialisation Dure. *Attention, cela détruira de manière permanente l'île actuelle de votre cache de navigateur et relancera un nouveau monde aléatoire !*

---
*Projet réalisé lors de la Game Jam 2026 de 803Z.*

![803Z](./public/803z.png)
