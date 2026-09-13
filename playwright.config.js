import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de parcours.
 *
 * Ils conduisent un vrai navigateur sur l'application assemblée, servie par
 * l'API et la base réelles. C'est le seul endroit où l'on voit ce que les
 * tests unitaires ne peuvent pas voir : une boucle de rendu, un écran qui
 * plante au chargement, un lien qui ne mène nulle part.
 *
 * L'adresse est « localhost » et non « 127.0.0.1 » : l'API n'autorise que la
 * première dans sa politique CORS, et la seconde ferait échouer chaque appel.
 */
const WEB = 'http://localhost:5173';
const API = 'http://127.0.0.1:4000';

export default defineConfig({
  testDir: './e2e',
  // Les parcours partagent un panier et un stock : les faire courir en
  // parallèle les ferait se marcher dessus.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: WEB,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Hors CI, le navigateur peut être fourni par l'environnement plutôt
    // qu'installé par Playwright.
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: [
    {
      command: 'npm start --prefix server',
      url: `${API}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      // Le serveur journalise chaque requête : tout reprendre noierait le
      // rapport de test sous des milliers de lignes.
      stdout: 'ignore',
    },
    {
      command: 'npm run preview -- --port 5173 --strictPort',
      url: WEB,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
