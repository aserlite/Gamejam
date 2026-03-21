import { ProjectLoader } from './engine/ProjectLoader.js';

const loader = new ProjectLoader('/src/projects', 'app', 'engine-canvas');
loader.discoverAndLoad();
