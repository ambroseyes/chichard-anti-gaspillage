import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { countQueries, prisma } from '../src/lib/prisma.js';
import { app, auth, createProduct, createStore, createUser, login, resetDatabase } from './helpers.js';
import { rankByRelevance, tokenize } from '../src/domain/catalog.js';
import { facetCache } from '../src/routes/catalog.js';

const jours = (n) => new Date(Date.now() + n * 86_400_000);

describe('recherche catalogue', () => {
  let store;

  beforeAll(async () => {
    await resetDatabase();

    const partner = await createUser('marchand@test.cm', { is_partner: true });
    store = await createStore(partner.email, { name: 'Marché Mokolo' });
    await prisma.user.update({ where: { id: partner.id }, data: { store_id: store.id } });

    // 30 produits d'épicerie : au-delà d'une page, pour vérifier qu'aucun ne
    // se perd entre deux pages.
    for (let i = 0; i < 30; i += 1) {
      await createProduct(store.id, {
        name: `Article épicerie ${String(i).padStart(2, '0')}`,
        store_name: 'Marché Mokolo',
        original_price: 1000 + i * 100,
        discounted_price: 500 + i * 100,
        expiration_date: jours(2 + (i % 5)),
      });
    }

    await createProduct(store.id, {
      name: 'Riz parfumé 5 kg',
      category: 'epicerie',
      brand: 'Mahima',
      tags: ['riz', 'sac'],
      store_name: 'Marché Mokolo',
      original_price: 7000,
      discounted_price: 5600,
      avg_rating: 4.5,
      reviews_count: 12,
      expiration_date: jours(6),
    });
    await createProduct(store.id, {
      name: 'Tomates fraîches',
      category: 'fruits_legumes',
      store_name: 'Boutique Riz du Nord',
      original_price: 2000,
      discounted_price: 200,
      expiration_date: jours(0), // périme aujourd'hui
    });
    await createProduct(store.id, {
      name: 'Yaourt nature',
      category: 'produits_laitiers',
      store_name: 'Marché Mokolo',
      original_price: 1000,
      discounted_price: 900,
      expiration_date: jours(3),
    });

    // Hors périmètre public : ne doit jamais apparaître.
    await createProduct(store.id, { name: 'Rupture de stock', quantity_available: 0 });
    await createProduct(store.id, { name: 'Produit retiré', status: 'flagged' });
    await createProduct(store.id, { name: 'Déjà périmé', expiration_date: jours(-3) });
  });

  afterAll(() => prisma.$disconnect());

  const search = (query = {}) => request(app).get('/api/catalog/search').query(query);

  it('pagine sans perdre ni répéter un produit', async () => {
    const premiere = await search({ per_page: 10, sort: 'price_asc' });
    expect(premiere.status).toBe(200);
    expect(premiere.body.data.items).toHaveLength(10);

    const total = premiere.body.data.page.total;
    expect(total).toBe(33);
    expect(premiere.body.data.page.pages).toBe(4);

    const vus = new Set();
    for (let page = 1; page <= premiere.body.data.page.pages; page += 1) {
      const res = await search({ per_page: 10, sort: 'price_asc', page });
      for (const item of res.body.data.items) vus.add(item.id);
    }
    // Le décompte annoncé et le nombre d'articles réellement atteignables
    // doivent coïncider : c'est ce que le filtrage côté navigateur ne garantit pas.
    expect(vus.size).toBe(total);
  });

  it('exclut les produits épuisés, retirés ou périmés', async () => {
    const res = await search({ per_page: 60 });
    const noms = res.body.data.items.map((p) => p.name);
    expect(noms).not.toContain('Rupture de stock');
    expect(noms).not.toContain('Produit retiré');
    expect(noms).not.toContain('Déjà périmé');
  });

  it('compte les facettes en gardant les autres choix possibles', async () => {
    const res = await search({ category: 'fruits_legumes' });
    const categories = res.body.data.facets.categories;

    // Le filtre est appliqué aux résultats…
    expect(res.body.data.items.every((p) => p.category === 'fruits_legumes')).toBe(true);
    // …mais la facette continue d'annoncer les autres rayons, sinon on ne
    // pourrait jamais en cocher un deuxième.
    const epicerie = categories.find((c) => c.value === 'epicerie');
    expect(epicerie.count).toBe(31);
    expect(categories.find((c) => c.value === 'produits_laitiers').count).toBe(1);
  });

  it('restreint la fenêtre d\'expiration et en donne le décompte', async () => {
    const res = await search({ expires: 'today' });
    expect(res.body.data.items.map((p) => p.name)).toEqual(['Tomates fraîches']);
    expect(res.body.data.facets.expiration.find((b) => b.value === 'week').count).toBeGreaterThan(1);
  });

  it('trie par prix et par remise en base, pas sur la page reçue', async () => {
    const croissant = await search({ sort: 'price_asc', per_page: 5 });
    const prix = croissant.body.data.items.map((p) => p.discounted_price);
    expect(prix).toEqual([...prix].sort((a, b) => a - b));
    expect(prix[0]).toBe(200);

    const remise = await search({ sort: 'discount', per_page: 3 });
    const remises = remise.body.data.items.map((p) => p.discount_percent);
    expect(remises).toEqual([...remises].sort((a, b) => b - a));
    expect(remises[0]).toBe(90);
  });

  it('cherche dans le nom, la marque et les étiquettes', async () => {
    const res = await search({ q: 'Mahima' });
    expect(res.body.data.items.map((p) => p.name)).toEqual(['Riz parfumé 5 kg']);
  });

  it('classe le produit nommé avant la boutique qui porte le mot', async () => {
    const res = await search({ q: 'riz' });
    const noms = res.body.data.items.map((p) => p.name);
    expect(noms).toContain('Riz parfumé 5 kg');
    expect(noms).toContain('Tomates fraîches'); // vendues par « Boutique Riz du Nord »
    expect(noms[0]).toBe('Riz parfumé 5 kg');
  });

  it('ignore les accents pour classer mais pas pour chercher', () => {
    const tokens = tokenize('parfumé');
    const classés = rankByRelevance(
      [
        { id: 'b', name: 'Boisson', description: 'parfumee' },
        { id: 'a', name: 'Parfumé maison', description: '' },
      ],
      tokens,
    );
    expect(classés[0].id).toBe('a');
  });

  it("n'interroge la base qu'une poignée de fois quand les facettes ne servent pas", async () => {
    facetCache.clear();

    const avecFacettes = await countQueries(() => search({ per_page: 6 }));
    facetCache.clear();
    const sansFacettes = await countQueries(() => search({ per_page: 6, facets: '0' }));

    // La trace SQL peut être éteinte : on ne teste que si elle a mesuré.
    if (avecFacettes === null || sansFacettes === null) return;

    expect(sansFacettes).toBeLessThan(avecFacettes);
    // Une rangée de l'accueil n'affiche que des produits : il lui faut la page
    // et son total, rien de plus. L'accueil en aligne trois.
    expect(sansFacettes).toBeLessThanOrEqual(3);
  });

  it('sert les décomptes de facettes depuis le cache au second appel', async () => {
    facetCache.clear();

    const premier = await countQueries(() => search({ category: 'epicerie' }));
    const second = await countQueries(() => search({ category: 'epicerie', page: 2 }));

    if (premier === null || second === null) return;

    // Les facettes ne dépendent pas de la page : la page 2 les retrouve en cache.
    expect(second).toBeLessThan(premier);
  });

  it('renvoie des facettes nulles, et non vides, quand on n’en veut pas', async () => {
    const res = await search({ facets: '0' });
    expect(res.status).toBe(200);
    expect(res.body.data.facets).toBeNull();
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.page.total).toBeGreaterThan(0);
  });

  it('refuse une catégorie inconnue au lieu de renvoyer tout le catalogue', async () => {
    const res = await search({ category: 'chaussures' });
    expect(res.status).toBe(400);
  });

  it('suggère produits, rayons et boutiques', async () => {
    const res = await request(app).get('/api/catalog/suggest').query({ q: 'riz' });
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
    expect(res.body.data.stores.map((s) => s.value)).toContain('Boutique Riz du Nord');

    const court = await request(app).get('/api/catalog/suggest').query({ q: 'r' });
    expect(court.body.data.products).toEqual([]);
  });
});

describe('remise stockée', () => {
  let partnerToken;
  let store;

  beforeAll(async () => {
    await resetDatabase();
    const partner = await createUser('remise@test.cm', { is_partner: true });
    store = await createStore(partner.email);
    await prisma.user.update({ where: { id: partner.id }, data: { store_id: store.id } });
    partnerToken = await login('remise@test.cm');
  });

  afterAll(() => prisma.$disconnect());

  const produit = (extra = {}) => ({
    name: 'Lait concentré',
    category: 'produits_laitiers',
    original_price: 1000,
    discounted_price: 600,
    quantity_available: 5,
    expiration_date: jours(4).toISOString().slice(0, 10),
    store_id: store.id,
    store_name: 'Magasin de test',
    ...extra,
  });

  it('calcule la remise à la création', async () => {
    const res = await request(app)
      .post('/api/entities/Product')
      .set(auth(partnerToken))
      .send(produit());
    expect(res.status).toBe(201);
    expect(res.body.data.discount_percent).toBe(40);
  });

  it('ignore une remise annoncée par le client', async () => {
    const res = await request(app)
      .post('/api/entities/Product')
      .set(auth(partnerToken))
      .send(produit({ discount_percent: 95 }));
    expect(res.status).toBe(201);
    expect(res.body.data.discount_percent).toBe(40);
  });

  it('recalcule la remise quand seul le prix remisé change', async () => {
    const créé = await request(app)
      .post('/api/entities/Product')
      .set(auth(partnerToken))
      .send(produit());

    const res = await request(app)
      .patch(`/api/entities/Product/${créé.body.data.id}`)
      .set(auth(partnerToken))
      .send({ discounted_price: 250 });

    expect(res.status).toBe(200);
    expect(res.body.data.discount_percent).toBe(75);
  });
});
