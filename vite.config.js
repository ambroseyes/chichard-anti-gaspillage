import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Le front appelle l'API par le proxy en développement : une seule origine,
    // donc pas de préflight CORS ni de cookie tiers.
    proxy: {
      '/api': { target: process.env.VITE_API_URL ?? 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: process.env.VITE_API_URL ?? 'http://localhost:4000', changeOrigin: true },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Seul le socle React est épinglé : il change rarement et reste donc
        // en cache entre deux déploiements. Le reste (graphiques, cartes,
        // scanner) suit les imports dynamiques des pages, et n'est téléchargé
        // que par ceux qui ouvrent l'écran concerné.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
