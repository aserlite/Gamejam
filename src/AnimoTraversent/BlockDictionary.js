export const BLOCKS = {
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
        dropAmount: 3,
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
    }
};
