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
        solid: true,
        texture: 'abyss'
    },
    deep_water: {
        id: 'deep_water',
        name: 'Eau Profonde',
        color: '#1e3799',
        solid: true,
        texture: 'deep_water'
    },
    water: {
        id: 'water',
        name: 'Eau',
        color: '#4a69bd',
        solid: true,
        texture: 'water'
    },
    sand: {
        id: 'sand',
        name: 'Sable',
        color: '#fad390',
        solid: false,
        texture: 'sand'
    },
    grass: {
        id: 'grass',
        name: 'Herbe',
        color: '#78e08f',
        solid: false,
        texture: 'grass'
    },
    wood: {
        id: 'wood',
        name: 'Pont en Bois',
        color: '#d35400',
        solid: false,
        placeable: true,
        texture: 'wood_bridge'
    },
    tree: {
        id: 'tree',
        name: 'Arbre',
        color: '#2d5a27',
        solid: true,
        harvestable: true,
        drops: 'wood',
        dropAmount: 2,
        floor: 'grass',
        texture: 'tree'
    },
    rock: {
        id: 'rock',
        name: 'Rocher',
        color: '#95a5a6',
        solid: true,
        harvestable: true,
        drops: 'stone',
        dropAmount: 2,
        floor: 'sand',
        texture: 'rock'
    },
    wood_wall: {
        id: 'wood_wall',
        name: 'Mur en bois',
        color: '#e67e22',
        solid: true,
        placeable: true,
        texture: 'wood_wall'
    },
    house_wall: {
        id: 'house_wall',
        name: 'Mur Foyer',
        color: '#2c3e50',
        solid: true,
        texture: 'wall'
    },
    plank_floor: {
        id: 'plank_floor',
        name: 'Plancher',
        color: '#8c7050',
        solid: false,
        placeable: true,
        texture: 'floor'
    },
    house_door: {
        id: 'house_door',
        name: 'Maison',
        color: '#d35400',
        solid: true,
        interactable: true,
        teleport: 'inside',
        placeable: true,
        texture: 'door'
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
