import { describe, expect, it } from 'vitest';
import { createPageUrl, pageNames } from '@/utils';
import { backofficeRoutes, publicAuthRoutes, routes } from '@/routes';

const allRoutes = [...routes, ...backofficeRoutes, ...publicAuthRoutes];

describe('table des routes', () => {
  it('ne déclare pas deux fois le même chemin', () => {
    const paths = allRoutes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('ne déclare pas deux fois le même nom', () => {
    const names = allRoutes.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('associe un composant à chaque route', () => {
    for (const route of allRoutes) expect(route.element).toBeTypeOf('object');
  });

  it('place le backoffice derrière un rôle', () => {
    for (const route of backofficeRoutes) {
      expect(['backoffice', 'backofficeAdmin', 'superAdmin']).toContain(route.role);
    }
  });

  it('conserve les paramètres accolés au nom de page', () => {
    // Régression : la carte produit passait « ProductDetail?id=42 ». Le nom
    // étant introuvable, chaque clic sur un produit ramenait à l'accueil.
    expect(createPageUrl('ProductDetail?id=42')).toBe('/ProductDetail?id=42');
    expect(createPageUrl('Catalog?category=epicerie&page=2')).toBe(
      '/Catalog?category=epicerie&page=2',
    );
    expect(createPageUrl('Home')).toBe('/');
  });

  it('ouvre le catalogue sans compte', () => {
    const catalogue = routes.find((r) => r.name === 'Catalog');
    expect(catalogue.role).toBeUndefined();
  });

  it('protège le panier et le paiement', () => {
    for (const name of ['Cart', 'Checkout', 'Orders', 'MyAccount']) {
      expect(routes.find((r) => r.name === name).role).toBe('authenticated');
    }
  });
});

describe('résolution des liens', () => {
  it("rend l'accueil sur la racine, pas sur /home", () => {
    expect(createPageUrl('Home')).toBe('/');
  });

  it('rend le chemin exact déclaré dans la table', () => {
    expect(createPageUrl('Catalog')).toBe('/Catalog');
    expect(createPageUrl('PartnerDashboard')).toBe('/PartnerDashboard');
  });

  it('retombe sur l’accueil pour un nom inconnu', () => {
    expect(createPageUrl('PageQuiNExistePas')).toBe('/');
  });

  it('connaît toutes les pages de la table', () => {
    expect(pageNames).toContain('Home');
    expect(pageNames.length).toBeGreaterThan(40);
  });
});

describe('cibles réellement utilisées par l’interface', () => {
  // Ces noms sont ceux qu'appelle `createPageUrl` dans les écrans : chacun doit
  // exister, sinon le lien mène au 404.
  const cibles = [
    'About', 'Achievements', 'BecomePartner', 'Cart', 'Catalog', 'Checkout',
    'Community', 'Contact', 'FoodCoach', 'Home', 'LoyaltyProgram',
    'Notifications', 'Orders', 'PartnerAnalytics', 'PartnerDashboard',
    'PartnerProducts', 'ProductDetail', 'StockGuardian',
  ];

  it.each(cibles)('%s est routé', (name) => {
    expect(pageNames).toContain(name);
  });
});
