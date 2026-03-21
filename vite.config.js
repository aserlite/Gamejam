import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  return {
    base: './', // Utiliser un chemin relatif garantit que ça marche peu importe le sous-dossier sur GitHub Pages
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});