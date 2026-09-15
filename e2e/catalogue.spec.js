import { expect, test } from '@playwright/test';

/**
 * Navigation marchande sans compte : ce que voit un visiteur qui arrive et
 * cherche quelque chose.
 */
test.describe('catalogue', () => {
  test("l'accueil présente des produits et mène au catalogue", async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sauvez des produits');
    // Les rangées thématiques sont servies par le moteur de recherche : si
    // elles sont vides, c'est que l'appel a échoué en silence.
    await expect(page.locator('article').first()).toBeVisible();

    await page.getByRole('link', { name: 'Voir le catalogue' }).click();
    await expect(page).toHaveURL(/\/Catalog/);
  });

  test('la page de résultats annonce un total et affiche une page', async ({ page }) => {
    await page.goto('/Catalog');

    const cartes = page.locator('article');
    await expect(cartes.first()).toBeVisible();

    const compte = await cartes.count();
    expect(compte).toBeGreaterThan(0);
    // La page est bornée : le catalogue entier n'atterrit pas dans le navigateur.
    expect(compte).toBeLessThanOrEqual(24);

    await expect(page.getByText(/produits? disponibles?/)).toBeVisible();
  });

  test('cocher un rayon filtre les résultats et se lit dans l’URL', async ({ page }) => {
    await page.goto('/Catalog');
    await expect(page.locator('article').first()).toBeVisible();

    // Le premier rayon proposé, quel qu'il soit : figer un nom rendrait le
    // test dépendant du jeu de données du jour.
    const premierRayon = page.locator('aside label').first();
    const libellé = (await premierRayon.textContent())?.replace(/[^\p{L}\s&'-]/gu, '').trim();
    await premierRayon.click();

    // L'état vit dans l'URL : le lien est partageable et le retour fonctionne.
    await expect(page).toHaveURL(/category=/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(libellé);

    await page.goBack();
    await expect(page).not.toHaveURL(/category=/);
  });

  test('le tri par remise ordonne réellement les résultats', async ({ page }) => {
    await page.goto('/Catalog?sort=discount');
    await expect(page.locator('article').first()).toBeVisible();

    const remises = await page
      .locator('article')
      .locator('text=/^−\\d+%$/')
      .allTextContents();

    const valeurs = remises.map((texte) => Number(texte.replace(/[^0-9]/g, '')));
    expect(valeurs.length).toBeGreaterThan(1);
    // Le classement vient de la base, pas d'un tri de la page déjà reçue.
    expect(valeurs).toEqual([...valeurs].sort((a, b) => b - a));
  });

  test('la recherche propose des suggestions et mène aux résultats', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('combobox').first().fill('riz');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('option').first()).toContainText(/riz/i);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/q=riz/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('riz');
  });

  test('une carte produit ouvre bien sa fiche', async ({ page }) => {
    await page.goto('/Catalog');
    const lien = page.locator('article h3 a').first();
    const nom = (await lien.textContent())?.trim();

    await lien.click();

    // Régression : le lien renvoyait à l'accueil, faute de gérer le paramètre.
    await expect(page).toHaveURL(/\/ProductDetail\?id=/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(nom);
    // Le bouton du bloc d'achat porte le montant ; ceux des produits
    // similaires portent le nom de leur produit.
    await expect(page.getByRole('button', { name: /^Ajouter — / })).toBeVisible();
  });

  test('une recherche sans résultat le dit au lieu de rester vide', async ({ page }) => {
    await page.goto('/Catalog?q=zzzzzintrouvable');
    await expect(page.getByText(/Aucun résultat/)).toBeVisible();
  });
});
