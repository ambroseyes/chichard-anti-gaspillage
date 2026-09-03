import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Ancré explicitement sur ce dossier : sans cela, vitest remonte au dépôt
  // racine et charge la configuration de l'interface.
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    environment: 'node',
    globals: false,
    // Les tests d'intégration partagent une base : ils s'exécutent en série.
    fileParallelism: false,
    setupFiles: [fileURLToPath(new URL('./tests/setup.js', import.meta.url))],
    testTimeout: 20_000,
  },
});
