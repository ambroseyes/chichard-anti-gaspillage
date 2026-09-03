import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { app, auth, createProduct, createStore, createUser, login, resetDatabase } from './helpers.js';

/**
 * Ces tests couvrent les failles relevées à l'audit : accès au backoffice,
 * escalade de privilèges, lecture des données d'autrui, écriture de champs
 * pilotés par le serveur.
 */
describe("contrôle d'accès", () => {
  let clientToken;
  let autreToken;
  let adminToken;
  let partnerToken;
  let store;
  let victime;

  beforeAll(async () => {
    await resetDatabase();

    await createUser('client@test.cm', { loyalty_points: 100 });
    victime = await createUser('victime@test.cm', { loyalty_points: 9999 });
    await createUser('admin@test.cm', { role: 'admin', backoffice_role: 'super_admin' });
    const partner = await createUser('partenaire@test.cm', { is_partner: true });

    store = await createStore(partner.email);
    await prisma.user.update({ where: { id: partner.id }, data: { store_id: store.id } });
    await createProduct(store.id);

    clientToken = await login('client@test.cm');
    autreToken = await login('victime@test.cm');
    adminToken = await login('admin@test.cm');
    partnerToken = await login('partenaire@test.cm');
  });

  afterAll(() => prisma.$disconnect());

  it('refuse le backoffice à un compte ordinaire', async () => {
    const res = await request(app).get('/api/backoffice/overview').set(auth(clientToken));
    expect(res.status).toBe(403);
  });

  it('refuse le backoffice à un visiteur anonyme', async () => {
    expect((await request(app).get('/api/backoffice/overview')).status).toBe(401);
  });

  it("laisse passer l'administrateur", async () => {
    const res = await request(app).get('/api/backoffice/overview').set(auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('revenue');
  });

  it("refuse la liste des utilisateurs à un compte ordinaire", async () => {
    const res = await request(app).get('/api/backoffice/users').set(auth(clientToken));
    expect(res.status).toBe(403);
  });

  it("empêche un utilisateur de se promouvoir administrateur", async () => {
    const cible = await prisma.user.findUnique({ where: { email: 'client@test.cm' } });

    const parBackoffice = await request(app)
      .patch(`/api/backoffice/users/${cible.id}/role`)
      .set(auth(clientToken))
      .send({ backoffice_role: 'super_admin' });
    expect(parBackoffice.status).toBe(403);

    const parEntite = await request(app)
      .patch(`/api/entities/User/${cible.id}`)
      .set(auth(clientToken))
      .send({ backoffice_role: 'super_admin', role: 'admin' });
    expect(parEntite.status).toBe(403);

    const parProfil = await request(app)
      .patch('/api/auth/me')
      .set(auth(clientToken))
      .send({ backoffice_role: 'super_admin' });
    expect(parProfil.status).toBe(400);

    const apres = await prisma.user.findUnique({ where: { id: cible.id } });
    expect(apres.backoffice_role).toBe('none');
    expect(apres.role).toBe('user');
  });

  it("empêche de créditer son propre solde de points", async () => {
    const cible = await prisma.user.findUnique({ where: { email: 'client@test.cm' } });
    const res = await request(app)
      .patch('/api/auth/me')
      .set(auth(clientToken))
      .send({ loyalty_points: 999_999 });
    expect(res.status).toBe(400);

    const apres = await prisma.user.findUnique({ where: { id: cible.id } });
    expect(apres.loyalty_points).toBe(100);
  });

  it("ne laisse pas lire les comptes des autres utilisateurs", async () => {
    const res = await request(app).get('/api/entities/User').set(auth(clientToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].email).toBe('client@test.cm');
  });

  it("n'expose jamais le condensat du mot de passe", async () => {
    const res = await request(app).get('/api/auth/me').set(auth(clientToken));
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  it("cloisonne les commandes entre clients", async () => {
    await prisma.order.create({
      data: {
        customer_email: victime.email,
        items: [],
        total_amount: 5000,
        order_number: 'CMD-TEST',
      },
    });

    const mienne = await request(app).get('/api/entities/Order').set(auth(clientToken));
    expect(mienne.body.data).toHaveLength(0);

    const sienne = await request(app).get('/api/entities/Order').set(auth(autreToken));
    expect(sienne.body.data).toHaveLength(1);
  });

  it("interdit la création directe d'une commande", async () => {
    const res = await request(app)
      .post('/api/entities/Order')
      .set(auth(clientToken))
      .send({ customer_email: 'client@test.cm', items: [], total_amount: 1 });
    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/point d'entrée métier/);
  });

  it("interdit la création directe d'un coupon", async () => {
    const res = await request(app)
      .post('/api/entities/Coupon')
      .set(auth(clientToken))
      .send({ code: 'CADEAU', user_email: 'client@test.cm', type: 'FIXED', value: 100000 });
    expect(res.status).toBe(403);
  });

  it("empêche un partenaire de modifier le magasin d'un autre", async () => {
    const autrePartenaire = await createUser('rival@test.cm', { is_partner: true });
    const autreStore = await createStore(autrePartenaire.email, { name: 'Magasin rival' });

    const res = await request(app)
      .patch(`/api/entities/Store/${autreStore.id}`)
      .set(auth(partnerToken))
      .send({ name: 'Détourné' });
    expect(res.status).toBe(403);

    const inchange = await prisma.store.findUnique({ where: { id: autreStore.id } });
    expect(inchange.name).toBe('Magasin rival');
  });

  it("ignore les champs pilotés par le serveur lors d'une écriture", async () => {
    const res = await request(app)
      .patch(`/api/entities/Store/${store.id}`)
      .set(auth(partnerToken))
      .send({ description: 'Nouvelle description', status: 'verified', total_revenue_recovered: 10_000_000 });

    expect(res.status).toBe(200);
    expect(res.body.meta.rejected_fields).toContain('total_revenue_recovered');
    const apres = await prisma.store.findUnique({ where: { id: store.id } });
    expect(apres.total_revenue_recovered).toBe(0);
    expect(apres.description).toBe('Nouvelle description');
  });

  it('laisse le catalogue accessible sans compte', async () => {
    const res = await request(app).get('/api/entities/Product');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('borne la taille des pages de résultats', async () => {
    const res = await request(app).get('/api/entities/Product?limit=5000');
    expect(res.status).toBe(400);
  });

  it('refuse un filtre sur un champ inconnu', async () => {
    const res = await request(app).get(
      `/api/entities/Product?filter=${encodeURIComponent('{"champ_invente":"x"}')}`,
    );
    expect(res.status).toBe(400);
  });
});
