import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // Les tests d'intégration partagent une base : ils s'exécutent en série.
    fileParallelism: false,
    setupFiles: ['./tests/setup.js'],
    testTimeout: 20_000,
  },
});
