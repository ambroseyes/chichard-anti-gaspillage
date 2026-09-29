import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { app, auth, createUser, login, resetDatabase } from './helpers.js';

/**
 * Guides « déjà vus », liés au compte.
 *
 * Le but : qu'un guide ne réapparaisse pas quand l'utilisateur revient d'un
 * autre appareil. L'état vit donc sur le compte, pas dans le navigateur, et
 * les clés sont contrôlées pour que ce champ ne devienne pas un stockage libre.
 */
describe('guides déjà vus', () => {
  let token;

  beforeAll(async () => {
    await resetDatabase();
    await createUser('vu@test.cm');
    token = await login('vu@test.cm');
  });

  afterAll(() => prisma.$disconnect());

  it('part d’une liste vide', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.data.tour_seen).toEqual([]);
  });

  it('retient une clé, sans doublon', async () => {
    await request(app).post('/api/auth/me/tour').set(auth(token)).send({ key: 'welcome' });
    const res = await request(app)
      .post('/api/auth/me/tour')
      .set(auth(token))
      .send({ key: 'page.Home' });
    expect(res.status).toBe(200);
    expect(res.body.data.tour_seen).toEqual(['welcome', 'page.Home']);

    // Rejouer la même clé ne l'ajoute pas deux fois.
    const encore = await request(app)
      .post('/api/auth/me/tour')
      .set(auth(token))
      .send({ key: 'welcome' });
    expect(encore.body.data.tour_seen).toEqual(['welcome', 'page.Home']);
  });

  it('refuse une clé hors format', async () => {
    for (const key of ['../etc', 'page.Home; DROP', 'n’importe quoi', 'page.', '']) {
      const res = await request(app).post('/api/auth/me/tour').set(auth(token)).send({ key });
      expect(res.status).toBe(400);
    }
  });

  it('réinitialise les clés visées, et garde les autres', async () => {
    const res = await request(app)
      .post('/api/auth/me/tour/reset')
      .set(auth(token))
      .send({ keys: ['page.Home'] });
    expect(res.status).toBe(200);
    expect(res.body.data.tour_seen).toEqual(['welcome']);
  });

  it('remet tout à zéro sans liste', async () => {
    const res = await request(app).post('/api/auth/me/tour/reset').set(auth(token)).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.tour_seen).toEqual([]);
  });

  it('n’est accessible qu’à un compte connecté', async () => {
    expect((await request(app).post('/api/auth/me/tour').send({ key: 'welcome' })).status).toBe(401);
    expect((await request(app).post('/api/auth/me/tour/reset').send({})).status).toBe(401);
  });

  it('lie l’état au compte, pas à la session', async () => {
    // Marquer via un jeton, relire via un autre : c'est le compte qui porte
    // l'état, donc les deux « appareils » voient la même chose.
    await request(app).post('/api/auth/me/tour').set(auth(token)).send({ key: 'welcome' });
    const autreAppareil = await login('vu@test.cm');
    const res = await request(app).get('/api/auth/me').set(auth(autreAppareil));
    expect(res.body.data.tour_seen).toContain('welcome');
  });
});
