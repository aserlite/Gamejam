import { Core } from './Core.js';

export class ProjectLoader {
    constructor(projectsDir, appElementId, canvasElementId) {
        this.projectsDir = projectsDir;
        this.appElement = document.getElementById(appElementId);
        this.canvasElementId = canvasElementId;
        this.engine = null;
        
        this.projectModules = import.meta.glob('/src/projects/*.js');
    }

    async discoverAndLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedProject = urlParams.get('p');
        const sharedData = urlParams.get('d');

        if (sharedProject) {
            let targetPath = null;
            for (const path in this.projectModules) {
                if (path.includes(`${sharedProject}.js`)) {
                    targetPath = path;
                    break;
                }
            }

            if (targetPath) {
                let initialGridData = null;
                if (sharedData) {
                    try {
                        initialGridData = decodeURIComponent(escape(atob(sharedData)));
                    } catch (e) {
                        console.error("Erreur lors du décodage des données partagées :", e);
                    }
                }
                
                await this.launchProject(targetPath, sharedProject, initialGridData);
                return;
            } else {
                console.warn(`Projet partagé '${sharedProject}' introuvable.`);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        this.appElement.innerHTML = `
            <div id="project-selector">
                <h1>Moteur<span>Vroum</span></h1>
                <p style="color: #888; margin-bottom: 2rem;">Sélectionnez un projet à lancer</p>
                <div id="project-list"></div>
            </div>
        `;

        const projectList = this.appElement.querySelector('#project-list');

        for (const path in this.projectModules) {
            const fileName = path.split('/').pop();
            const projectName = fileName.replace('.js', '');

            const button = document.createElement('button');
            button.innerHTML = `<span>${projectName}</span>`;
            button.onclick = () => this.launchProject(path, projectName, null);
            projectList.appendChild(button);
        }
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