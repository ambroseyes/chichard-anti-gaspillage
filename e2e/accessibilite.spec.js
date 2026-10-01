import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

/**
 * Accessibilité du parcours d'achat.
 *
 * On passe axe-core sur chaque écran que traverse un acheteur — accueil,
 * catalogue, fiche produit, panier, tunnel, commandes — et on refuse toute
 * violation « serious » ou « critical ». C'est le filet qui empêche une
 * régression discrète : un gris trop clair, un badge sans contraste, un
 * libellé posé sur le mauvais élément.
 *
 * Les règles visées sont celles des WCAG 2.0 et 2.1, niveaux A et AA : le
 * socle légal et contractuel usuel.
 */

const CLIENT = { email: 'client@chichard.cm', motDePasse: 'chichard-demo-2026' };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const menuDuCompte = (page) => page.getByRole('button', { name: /^B?\s*Bonjour/ });

/** Connexion par l'écran réel : on audite ce que l'utilisateur voit vraiment. */
async function seConnecter(page) {
  await page.goto('/connexion');
  await page.getByLabel('Adresse e-mail').fill(CLIENT.email);
  await page.getByLabel('Mot de passe').fill(CLIENT.motDePasse);
  await page.getByRole('button', { name: /connexion|se connecter/i }).click();
  await expect(menuDuCompte(page)).toBeVisible({ timeout: 15_000 });
}

/**
 * Écarte le guide interactif avant l'audit.
 *
 * À la première connexion une modale de bienvenue s'ouvre, puis le guide de
 * la page se lance après un court délai. On les ferme comme le ferait un
 * visiteur pressé, pour auditer la page elle-même et non l'aide par-dessus.
 */
async function fermerLeGuide(page) {
  const plusTard = page.getByRole('button', { name: /^(Plus tard|Later)$/ });
  if (await plusTard.isVisible().catch(() => false)) {
    await plusTard.click();
  }
  // Le guide de page démarre ~500 ms après l'arrivée ; on laisse quelques
  // fenêtres pour le saisir quel que soit l'aléa de chargement.
  for (let essai = 0; essai < 4; essai += 1) {
    await page.waitForTimeout(450);
    const fermer = page.getByRole('button', { name: /Fermer le guide|Close the guide/i });
    if (await fermer.isVisible().catch(() => false)) {
      await fermer.click();
    } else if (essai >= 1) {
      break; // plus de guide à l'écran après une fenêtre d'attente
    }
  }
}

/** Audite la page courante et échoue en nommant chaque violation grave. */
async function auditer(page, nom) {
  await fermerLeGuide(page);
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const resume = graves
    .map((v) => `  • ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.help}`)
    .join('\n');
  expect(graves.length, `${nom} — violations d'accessibilité :\n${resume}`).toBe(0);
}

test.describe("accessibilité du parcours d'achat", () => {
  test.beforeEach(async ({ page }) => {
    await seConnecter(page);
  });

  test("aucune violation majeure de l'accueil aux commandes", async ({ page }) => {
    await page.goto('/');
    await auditer(page, 'Accueil');

    await page.goto('/Catalog');
    await auditer(page, 'Catalogue');

    // Fiche produit : on suit le premier lien du catalogue.
    await page.goto('/Catalog');
    await page.waitForLoadState('networkidle');
    const href = await page.locator('article a').first().getAttribute('href');
    await page.goto(href);
    await auditer(page, 'Fiche produit');

    // Un article dans le panier pour que le panier et le tunnel aient du fond.
    await page.goto('/Catalog');
    await page.locator('article button', { hasText: 'Ajouter' }).first().click();
    await page.waitForTimeout(800);

    await page.goto('/Cart');
    await auditer(page, 'Panier');

    await page.goto('/Checkout');
    await auditer(page, 'Tunnel de commande');

    await page.goto('/Orders');
    await auditer(page, 'Mes commandes');
  });
});
