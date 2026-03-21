export class MapGenerator {
    constructor() {
        this.p = new Uint8Array(512);
        this.initPermutationTable();

        this.biomes = {
            DEEP_OCEAN: { name: 'Océan Profond', color: '#1A4D7E', type: 'WATER' },
            OCEAN: { name: 'Océan', color: '#2980B9', type: 'WATER' },
            SAND: { name: 'Sable', color: '#E6C27A', type: 'SAND' },
            PLAINS: { name: 'Plaines', color: '#2ECC71', type: 'GRASS' },
            FOREST: { name: 'Forêt', color: '#27AE60', type: 'GRASS' },
            ROCK: { name: 'Montagne', color: '#7F8C8D', type: 'ROCK' },
            SNOW: { name: 'Neige', color: '#FFFFFF', type: 'SNOW' }
        };

    }

    initPermutationTable() {
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) {
            this.p[i] = p[i & 255];
        }
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

    lerp(t, a, b) { return a + t * (b - a); }

    perlin(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;

        return this.lerp(v,
            this.lerp(u, this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y)),
            this.lerp(u, this.grad(this.p[A + 1], x, y - 1), this.grad(this.p[B + 1], x - 1, y - 1))
        );
    }

    fbm(x, y, octaves = 4) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += this.perlin(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2.0;
        }

        return (total / maxValue) * 0.5 + 0.5;
    }

    grad(hash, x, y) {
        const h = hash & 7;
        const u = h < 4 ? x : y;
        const v = h < 4 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
    }

    onInit(engine, dataLoaded) {
        engine.debugDisplay.setCustomData('Projet', 'Générateur Procédural');
        engine.debugDisplay.setCustomData('Déplacement', 'Shift + Clic Gauche (Pan)');
        engine.colorPalette.colors = [];
        engine.colorPalette.enabled = false;

        engine.debugDisplay.removeCustomData('Outil');
        if (!dataLoaded) {
            this.initPermutationTable();
            const mapRadius = 150;
            const scale = 0.02;

            for (let x = -mapRadius; x <= mapRadius; x++) {
                for (let y = -mapRadius; y <= mapRadius; y++) {

                    const elevation = this.fbm(x * scale, y * scale, 4);
                    let biome = this.biomes.DEEP_OCEAN;

                    if (elevation < 0.35) biome = this.biomes.DEEP_OCEAN;
                    else if (elevation < 0.45) biome = this.biomes.OCEAN;
                    else if (elevation < 0.50) biome = this.biomes.SAND;
                    else if (elevation < 0.65) biome = this.biomes.PLAINS;
                    else if (elevation < 0.75) biome = this.biomes.FOREST;
                    else if (elevation < 0.85) biome = this.biomes.ROCK;
                    else biome = this.biomes.SNOW;

                    engine.grid.setCell(x, y, { ...biome });
                }
            }
        }
    }

    handleInputs(engine) {
    }

    onTick(dt, engine) {

    }

    onRender(ctx, camera) {
    }
}