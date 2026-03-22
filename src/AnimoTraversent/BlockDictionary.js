export const BLOCKS = {
    empty_hand: {
        id: 'empty_hand',
        name: 'Main vide',
        color: 'transparent',
        solid: false,
        placeable: false
    },
    campfire: {
        id: 'campfire',
        name: 'Feu',
        color: '#dba87cff',
        solid: true,
        placeable: true
    },
    abyss: {
        id: 'abyss',
        name: 'Océan',
        color: '#091c52',
        solid: true
    },
    deep_water: {
        id: 'deep_water',
        name: 'Eau Profonde',
        color: '#1e3799',
        solid: true
    },
    water: {
        id: 'water',
        name: 'Eau',
        color: '#4a69bd',
        solid: true
    },
    sand: {
        id: 'sand',
        name: 'Sable',
        color: '#fad390',
        solid: false
    },
    grass: {
        id: 'grass',
        name: 'Herbe',
        color: '#78e08f',
        solid: false
    },
    wood: {
        id: 'wood',
        name: 'Pont en Bois',
        color: '#d35400',
        solid: false,
        placeable: true
    },
    tree: {
        id: 'tree',
        name: 'Arbre',
        color: '#2d5a27',
        solid: true,
        harvestable: true,
        drops: 'wood',
        dropAmount: 2,
        floor: 'grass'
    },
    rock: {
        id: 'rock',
        name: 'Rocher',
        color: '#95a5a6',
        solid: true,
        harvestable: true,
        drops: 'stone',
        dropAmount: 2,
        floor: 'sand'
    },
    wood_wall: {
        id: 'wood_wall',
        name: 'Mur en bois',
        color: '#e67e22',
        solid: true,
        placeable: true
    },
    house_wall: {
        id: 'house_wall',
        name: 'Mur Foyer',
        color: '#2c3e50',
        solid: true
    },
    plank_floor: {
        id: 'plank_floor',
        name: 'Plancher',
        color: '#8c7050',
        solid: false,
        placeable: true
    },
    house_door: {
        id: 'house_door',
        name: 'Maison',
        color: '#d35400',
        solid: true,
        interactable: true,
        teleport: 'inside',
        placeable: true
    },
    house_structure: {
        id: 'house_structure',
        name: 'Toit',
        color: '#78e08f',
        solid: true,
        placeable: false
    },
    house_exit: {
        id: 'house_exit',
        name: 'Sortie',
        color: '#c0392b',
        solid: true,
        interactable: true,
        teleport: 'outside'
    }
};
