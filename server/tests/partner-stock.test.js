import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { app, auth, createProduct, createStore, createUser, login, resetDatabase } from './helpers.js';

/**
 * Le stock d'un partenaire dépasse vite la page par défaut. Ces tests fixent
 * ce qui doit rester vrai : tout le stock est atteignable, et la recherche
 * porte sur l'ensemble, pas sur la page déjà reçue.
 */
describe('stock du partenaire', () => {
  let token;
  let store;

  beforeAll(async () => {
    await resetDatabase();

    const partner = await createUser('stock@test.cm', { is_partner: true });
    store = await createStore(partner.email, { name: 'Épicerie du Lac' });
    await prisma.user.update({ where: { id: partner.id }, data: { store_id: store.id } });
    token = await login('stock@test.cm');

    // 60 références : au-delà de la page par défaut de 50.
    for (let i = 0; i < 60; i += 1) {
      await createProduct(store.id, {
        name: `Référence ${String(i).padStart(3, '0')}`,
        store_name: store.name,
      });
    }

    // Une référence ancienne, volontairement nommée autrement.
    await createProduct(store.id, {
      name: 'Confiture de goyave artisanale',
      store_name: store.name,
      status: 'sold_out',
      quantity_available: 0,
    });
  });

  afterAll(() => prisma.$disconnect());

  const lister = (filter, extra = {}) =>
    request(app)
      .get('/api/entities/Product')
      .set(auth(token))
      .query({ filter: JSON.stringify(filter), limit: 25, ...extra });

  it('annonce le stock complet, pas seulement la première page', async () => {
    const res = await lister({ store_id: store.id });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(25);
    expect(res.body.meta.total).toBe(61);
  });

  it('rend chaque produit atteignable en paginant', async () => {
    const vus = new Set();
    for (let offset = 0; offset < 61; offset += 25) {
      const res = await lister({ store_id: store.id }, { offset });
      for (const produit of res.body.data) vus.add(produit.id);
    }
    // Le décompte annoncé et le nombre d'articles réellement atteignables
    // doivent coïncider : c'est ce qu'une recherche en mémoire ne garantit pas.
    expect(vus.size).toBe(61);
  });

  it('trouve une référence qui ne figure pas dans la première page', async () => {
    // Régression : l'écran cherchait dans les cinquante produits déjà chargés.
    // « Confiture » est le plus ancien du stock, donc absent de cette page.
    const res = await lister({
      store_id: store.id,
      name: { contains: 'confiture', mode: 'insensitive' },
    });

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].name).toBe('Confiture de goyave artisanale');
  });

  it('filtre par statut sur l’ensemble du stock', async () => {
    const épuisés = await lister({ store_id: store.id, status: 'sold_out' });
    expect(épuisés.body.meta.total).toBe(1);

    const enVente = await lister({ store_id: store.id, status: 'active' });
    expect(enVente.body.meta.total).toBe(60);
  });

  it('ne laisse pas un partenaire lister le stock d’un autre magasin', async () => {
    const autre = await createUser('rival@test.cm', { is_partner: true });
    const autreMagasin = await createStore(autre.email, { name: 'Chez le rival' });
    await prisma.user.update({ where: { id: autre.id }, data: { store_id: autreMagasin.id } });
    const jetonRival = await login('rival@test.cm');

    const res = await request(app)
      .get('/api/entities/Product')
      .set(auth(jetonRival))
      .query({ filter: JSON.stringify({ store_id: store.id }) });

    // Le catalogue est public en lecture : ce qui compte est qu'il ne voie
    // rien de plus qu'un visiteur, et surtout qu'il ne puisse pas y écrire.
    const modification = await request(app)
      .patch(`/api/entities/Product/${res.body.data[0]?.id}`)
      .set(auth(jetonRival))
      .send({ discounted_price: 1 });

    expect(modification.status).toBe(403);
  });
});
