import { Core } from './Core.js';

export class ProjectLoader {
    constructor(projectsDir, appElementId, canvasElementId) {
        this.projectsDir = projectsDir;
        this.appElement = document.getElementById(appElementId);
        this.canvasElementId = canvasElementId;
        this.engine = null;
        
        this.projectModules = import.meta.glob('/src/projects/*.js');
    }

    async launchProject(path, projectName, initialGridData = null) {
        const importFn = this.projectModules[path];
        
        if (!importFn) {
             console.error(`Le projet ${path} n'est pas enregistré dans Vite.`);
             return;
        }

        try {
            const module = await importFn();
            const projectClass = module[projectName];

            if (!projectClass) {
                console.error(`La classe ${projectName} n'a pas été trouvée dans ${path}`);
                return;
            }

            this.appElement.style.display = 'none';
            
            this.engine = new Core(this.canvasElementId);
            this.engine.loadProject(new projectClass(), projectName, initialGridData);
            this.engine.start();
            
            if (!initialGridData) {
                const url = new URL(window.location.href);
                url.searchParams.set('p', projectName);
                url.searchParams.delete('d');
                window.history.replaceState({}, document.title, url.toString());
            }
        } catch (e) {
            console.error("Erreur lors du chargement dynamique du projet :", e);
        }
    }
}