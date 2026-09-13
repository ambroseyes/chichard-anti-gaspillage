import { expect, test } from '@playwright/test';

const CLIENT = { email: 'client@chichard.cm', motDePasse: 'chichard-demo-2026' };

/** Connexion par l'écran réel : on teste le chemin que prend l'utilisateur. */
async function seConnecter(page) {
  await page.goto('/connexion');
  await page.getByLabel('Adresse e-mail').fill(CLIENT.email);
  await page.getByLabel('Mot de passe').fill(CLIENT.motDePasse);
  await page.getByRole('button', { name: /connexion|se connecter/i }).click();

  // Le menu du compte porte le nom de l'utilisateur : c'est le signe que la
  // session est bien établie côté interface, pas seulement côté serveur.
  await expect(menuDuCompte(page)).toBeVisible({ timeout: 15_000 });
}

const menuDuCompte = (page) => page.getByRole('button', { name: /^B?\s*Bonjour/ });

/**
 * Remet le panier à zéro : les parcours partagent un compte, donc un panier.
 *
 * Le même bouton décrémente ou supprime selon la quantité restante, et son
 * libellé change avec : ne viser que « Supprimer » laissait en place tout
 * article présent en plusieurs exemplaires.
 */
async function viderLePanier(page) {
  await page.goto('/Cart');
  // Les articles arrivent par une requête. `count()` ne patiente pas : sans
  // cette attente, on lit un panier encore vide et on repart en croyant
  // l'avoir vidé.
  await page.waitForLoadState('networkidle');

  for (let garde = 0; garde < 40; garde += 1) {
    const boutons = page.getByRole('button', { name: /^(Supprimer|Retirer un) / });
    if ((await boutons.count()) === 0) break;
    await boutons.first().click();
    await page.waitForTimeout(400);
  }

  await expect(page.getByRole('heading', { name: 'Votre panier est vide' })).toBeVisible({
    timeout: 10_000,
  });
}

test.describe('parcours d’achat', () => {
  test.beforeEach(async ({ page }) => {
    await seConnecter(page);
    await viderLePanier(page);
  });

  test('ajouter au panier met à jour l’en-tête et le tiroir', async ({ page }) => {
    await page.goto('/Catalog');

    const carte = page.locator('article').first();
    const nom = (await carte.locator('h3 a').textContent())?.trim();
    await carte.getByRole('button', { name: /^Ajouter / }).click();

    // Le nombre d'articles est annoncé aux lecteurs d'écran : on le lit là,
    // plutôt que de chercher un chiffre dans un texte qui contient un prix.
    const panier = page.getByRole('button', { name: /Ouvrir le panier, 1 article/ });
    await expect(panier).toBeVisible();

    await panier.click();
    const tiroir = page.getByRole('dialog');
    await expect(tiroir).toContainText('Mon panier');
    await expect(tiroir).toContainText(nom);
    await expect(tiroir).toContainText('Sous-total');
  });

  test('le total de la commande suit le mode de récupération', async ({ page }) => {
    await page.goto('/Catalog');
    await page.locator('article button', { hasText: 'Ajouter' }).first().click();
    await page.waitForTimeout(800);

    await page.goto('/Checkout');
    await expect(page.getByRole('heading', { name: 'Livraison et contact' })).toBeVisible();

    const total = page.locator('aside').getByText(/^Total$/).locator('..');
    const auRetrait = await total.textContent();

    await page.getByText('Livraison à domicile').click();
    await page.waitForTimeout(1200);
    const àLaLivraison = await total.textContent();

    // Les frais viennent du devis serveur : le total doit bouger, et vers le haut.
    expect(àLaLivraison).not.toBe(auRetrait);
    const chiffres = (texte) => Number(texte.replace(/[^0-9]/g, ''));
    expect(chiffres(àLaLivraison)).toBeGreaterThan(chiffres(auRetrait));
  });

  test('la commande va jusqu’à la confirmation', async ({ page }) => {
    await page.goto('/Catalog');
    await page.locator('article button', { hasText: 'Ajouter' }).first().click();
    await page.waitForTimeout(800);

    await page.goto('/Checkout');
    await expect(page.getByRole('heading', { name: 'Livraison et contact' })).toBeVisible();
    await page.getByLabel('Numéro de téléphone').fill('699112233');

    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByRole('heading', { name: 'Moyen de paiement' })).toBeVisible();

    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByRole('heading', { name: 'Vérifier et confirmer' })).toBeVisible();

    await page.getByRole('button', { name: /Confirmer —/ }).click();

    await expect(page).toHaveURL(/OrderConfirmation/, { timeout: 20_000 });
    // Le code de retrait n'est donné qu'une fois, à la création : s'il manque,
    // le client ne peut pas récupérer sa commande.
    await expect(page).toHaveURL(/code=/);
  });

  test('un panier vide ne propose pas de commander', async ({ page }) => {
    await page.goto('/Checkout');
    await expect(page.getByText(/panier est vide/i)).toBeVisible();
  });
});

test.describe('surveillance des erreurs', () => {
  /**
   * Les défauts les plus coûteux de ce projet — boucle de rendu, plantage au
   * chargement, appel vers une route disparue — ne se voyaient qu'en console.
   * Ce test échoue si un écran du chemin d'achat en produit.
   */
  test('les écrans principaux se chargent sans erreur console ni appel en échec', async ({ page }) => {
    const erreurs = [];
    const échecs = [];

    page.on('pageerror', (erreur) => erreurs.push(erreur.message));
    page.on('console', (message) => {
      if (message.type() === 'error') erreurs.push(message.text());
    });
    page.on('response', (réponse) => {
      if (réponse.status() >= 400) échecs.push(`${réponse.status()} ${réponse.url()}`);
    });

    for (const chemin of ['/', '/Catalog', '/Catalog?sort=discount', '/ClickCollect', '/About']) {
      await page.goto(chemin, { waitUntil: 'networkidle' });
    }

    await page.goto('/Catalog');
    await page.locator('article h3 a').first().click();
    await page.waitForLoadState('networkidle');

    expect(erreurs, `erreurs console :\n${erreurs.join('\n')}`).toEqual([]);
    expect(échecs, `appels en échec :\n${échecs.join('\n')}`).toEqual([]);
  });
});
