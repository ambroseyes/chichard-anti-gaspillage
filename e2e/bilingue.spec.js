import { expect, test } from '@playwright/test';

/**
 * Bascule de langue.
 *
 * Ce qui doit rester vrai : le choix se voit tout de suite, il tient d'une
 * page à l'autre, et l'attribut `lang` du document suit — c'est lui qui dit
 * aux lecteurs d'écran dans quelle langue lire.
 */
test.describe('bilingue FR/EN', () => {
  test('bascule la coque en anglais et pose l’attribut lang', async ({ page }) => {
    await page.goto('/');

    // Par défaut, français (navigateur en fr-FR).
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('button', { name: 'All departments' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Anglais' }).first().click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // Barre de rayons, barre de service et menu compte, tous traduits.
    await expect(page.getByRole('button', { name: 'All departments' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sell on Chichard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('le choix de langue tient d’une page à l’autre', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Anglais' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Navigation vers une autre page : la langue ne repart pas au français.
    await page.goto('/Catalog');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Full catalogue');
    // Le rail de facettes est traduit : ses en-têtes de groupe le prouvent.
    await expect(page.getByRole('heading', { name: 'Departments', exact: true })).toBeVisible();
    await expect(page.getByText('Sort by')).toBeVisible();
  });

  test('revenir au français restaure la langue source', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Anglais' }).first().click();
    await expect(page.getByRole('button', { name: 'All departments' })).toBeVisible();

    await page.getByRole('button', { name: 'French' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('button', { name: 'Tous les rayons' })).toBeVisible();
  });
});
