import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { app, auth, createStore, createUser, login, resetDatabase } from './helpers.js';

/**
 * Suivi commercial des boutiques.
 *
 * Deux choses doivent rester vraies : l'avancement est décidé par le
 * backoffice et par personne d'autre — `Store.update` est ouvert au
 * propriétaire de la boutique —, et les compteurs par étape portent sur le
 * périmètre affiché, sans que filtrer sur une étape n'efface les autres.
 */
describe('pipeline commercial', () => {
  let adminToken;
  let commerçantToken;
  let maBoutique;

  beforeAll(async () => {
    await resetDatabase();

    await createUser('ops@test.cm', { role: 'admin', backoffice_role: 'super_admin' });
    const commerçant = await createUser('commercant@test.cm', { is_partner: true });

    maBoutique = await createStore(commerçant.email, {
      name: 'Boulangerie du Marché',
      city: 'Douala',
      pipeline_stage: 'contacted',
      pipeline_expected_value: 120_000,
    });
    await prisma.user.update({
      where: { id: commerçant.id },
      data: { store_id: maBoutique.id },
    });

    // Trois autres boutiques, réparties sur des étapes et des statuts
    // différents : c'est ce qui rend les agrégats vérifiables.
    await createStore('autre1@test.cm', {
      name: 'Primeur Bonapriso',
      city: 'Douala',
      status: 'verified',
      pipeline_stage: 'proposal',
      pipeline_expected_value: 300_000,
    });
    await createStore('autre2@test.cm', {
      name: 'Supérette Bastos',
      city: 'Yaoundé',
      status: 'pending',
      pipeline_stage: 'proposal',
      pipeline_expected_value: 50_000,
    });
    await createStore('autre3@test.cm', {
      name: 'Marché Mokolo',
      city: 'Yaoundé',
      status: 'verified',
      pipeline_stage: 'won',
      pipeline_expected_value: 900_000,
    });

    adminToken = await login('ops@test.cm');
    commerçantToken = await login('commercant@test.cm');
  });

  afterAll(() => prisma.$disconnect());

  const étape = (étapes, nom) => étapes.find((ligne) => ligne.stage === nom);

  // --- Qui décide de l'avancement ------------------------------------------

  it("refuse au commerçant d'avancer sa propre boutique", async () => {
    const res = await request(app)
      .patch(`/api/backoffice/stores/${maBoutique.id}/pipeline`)
      .set(auth(commerçantToken))
      .send({ pipeline_stage: 'won' });

    expect(res.status).toBe(403);

    const après = await prisma.store.findUnique({ where: { id: maBoutique.id } });
    expect(après.pipeline_stage).toBe('contacted');
  });

  it("ignore les champs du pipeline écrits par l'API générique", async () => {
    // Le commerçant a le droit de modifier sa boutique ; ces champs-là, non.
    const res = await request(app)
      .patch(`/api/entities/Store/${maBoutique.id}`)
      .set(auth(commerçantToken))
      .send({
        description: 'Pains et viennoiseries',
        pipeline_stage: 'won',
        pipeline_expected_value: 10_000_000,
        pipeline_owner_email: 'commercant@test.cm',
      });

    expect(res.status).toBe(200);
    expect(res.body.meta.rejected_fields).toEqual(
      expect.arrayContaining([
        'pipeline_stage',
        'pipeline_expected_value',
        'pipeline_owner_email',
      ]),
    );

    const après = await prisma.store.findUnique({ where: { id: maBoutique.id } });
    // La modification légitime est passée, l'auto-promotion non.
    expect(après.description).toBe('Pains et viennoiseries');
    expect(après.pipeline_stage).toBe('contacted');
    expect(après.pipeline_expected_value).toBe(120_000);
  });

  // --- Ce que fait le backoffice -------------------------------------------

  it("date l'entrée dans l'étape et en laisse une trace", async () => {
    const avant = Date.now();
    const res = await request(app)
      .patch(`/api/backoffice/stores/${maBoutique.id}/pipeline`)
      .set(auth(adminToken))
      .send({
        pipeline_stage: 'negotiation',
        pipeline_expected_value: 150_000,
        pipeline_owner_email: 'ops@test.cm',
        pipeline_notes: 'Rendez-vous pris pour la semaine prochaine.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.pipeline_stage).toBe('negotiation');
    expect(res.body.data.pipeline_expected_value).toBe(150_000);

    // La date est posée par le serveur : le client ne l'a pas envoyée.
    const changée = new Date(res.body.data.pipeline_stage_changed_at).getTime();
    expect(changée).toBeGreaterThanOrEqual(avant);

    const journal = await prisma.auditLog.findFirst({
      where: { action: 'pipeline_stage', entity_id: maBoutique.id },
    });
    expect(journal).not.toBeNull();
    expect(journal.metadata).toMatchObject({ from: 'contacted', to: 'negotiation' });
  });

  it("ne redate pas l'étape quand seule une note change", async () => {
    const avant = await prisma.store.findUnique({ where: { id: maBoutique.id } });

    const res = await request(app)
      .patch(`/api/backoffice/stores/${maBoutique.id}/pipeline`)
      .set(auth(adminToken))
      .send({ pipeline_stage: 'negotiation', pipeline_notes: 'Relancé par téléphone.' });

    expect(res.status).toBe(200);
    expect(new Date(res.body.data.pipeline_stage_changed_at).toISOString()).toBe(
      avant.pipeline_stage_changed_at.toISOString(),
    );
  });

  it('refuse une étape qui ne fait pas partie du cycle', async () => {
    const res = await request(app)
      .patch(`/api/backoffice/stores/${maBoutique.id}/pipeline`)
      .set(auth(adminToken))
      .send({ pipeline_stage: 'gagné-davance' });

    expect(res.status).toBe(400);
  });

  it('répond 404 sur une boutique qui n’existe pas', async () => {
    const res = await request(app)
      .patch('/api/backoffice/stores/inconnue/pipeline')
      .set(auth(adminToken))
      .send({ pipeline_stage: 'won' });

    expect(res.status).toBe(404);
  });

  // --- Les compteurs affichés en tête de liste ------------------------------

  it('compte et additionne par étape sur tout le portefeuille', async () => {
    const res = await request(app).get('/api/backoffice/stores').set(auth(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(4);

    // Les sept étapes sont toujours présentes, même vides : sinon les
    // colonnes de l'écran apparaissent et disparaissent d'un filtre à l'autre.
    expect(res.body.meta.by_stage).toHaveLength(7);
    expect(étape(res.body.meta.by_stage, 'new')).toMatchObject({ count: 0, expected_value: 0 });
    expect(étape(res.body.meta.by_stage, 'proposal')).toMatchObject({
      count: 2,
      expected_value: 350_000,
    });
    expect(étape(res.body.meta.by_stage, 'won')).toMatchObject({
      count: 1,
      expected_value: 900_000,
    });
  });

  it("garde les autres étapes visibles quand on en sélectionne une", async () => {
    const res = await request(app)
      .get('/api/backoffice/stores')
      .set(auth(adminToken))
      .query({ stage: 'proposal' });

    expect(res.status).toBe(200);
    // La liste est réduite…
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.every((s) => s.pipeline_stage === 'proposal')).toBe(true);
    // …mais pas les compteurs, sans quoi on perdrait de vue le reste.
    expect(étape(res.body.meta.by_stage, 'won').count).toBe(1);
  });

  it('restreint les compteurs aux autres filtres, eux', async () => {
    // Un filtre qui n'est pas l'étape doit, lui, réduire les compteurs :
    // sinon les montants affichés ne correspondent plus à ce qu'on regarde.
    const res = await request(app)
      .get('/api/backoffice/stores')
      .set(auth(adminToken))
      .query({ q: 'Yaoundé', stage: 'proposal' });

    expect(res.status).toBe(200);
    expect(étape(res.body.meta.by_stage, 'proposal')).toMatchObject({
      count: 1,
      expected_value: 50_000,
    });
    expect(étape(res.body.meta.by_stage, 'won').count).toBe(1);
  });

  it('remonte les relances en retard en tête de liste', async () => {
    // L'écran sert à savoir qui rappeler. Trié par date d'inscription, un
    // dossier échu depuis trois semaines se retrouvait au milieu de la page.
    const [échu, proche, sansÉchéance] = await Promise.all([
      prisma.store.findFirst({ where: { name: 'Primeur Bonapriso' } }),
      prisma.store.findFirst({ where: { name: 'Supérette Bastos' } }),
      prisma.store.findFirst({ where: { name: 'Marché Mokolo' } }),
    ]);
    await prisma.store.update({
      where: { id: échu.id },
      data: { pipeline_next_action_at: new Date(Date.now() - 20 * 86_400_000) },
    });
    await prisma.store.update({
      where: { id: proche.id },
      data: { pipeline_next_action_at: new Date(Date.now() + 2 * 86_400_000) },
    });
    await prisma.store.update({
      where: { id: sansÉchéance.id },
      data: { pipeline_next_action_at: null },
    });

    const res = await request(app).get('/api/backoffice/stores').set(auth(adminToken));
    const noms = res.body.data.map((s) => s.name);

    expect(noms.indexOf('Primeur Bonapriso')).toBeLessThan(noms.indexOf('Supérette Bastos'));
    // Les dossiers sans prochaine action ne s'intercalent pas devant ceux
    // qui en ont une : ils ferment la marche.
    expect(noms.indexOf('Supérette Bastos')).toBeLessThan(noms.indexOf('Marché Mokolo'));
  });

  it("ne livre pas le jeton de vérification d'adresse aux opérateurs", async () => {
    // Le schéma déclare ce champ masqué. La liste renvoyait la ligne brute :
    // un opérateur pouvait lire le jeton qui valide l'adresse d'un commerçant.
    await prisma.store.update({
      where: { id: maBoutique.id },
      data: { verification_token: 'jeton-secret-de-test' },
    });

    const liste = await request(app).get('/api/backoffice/stores').set(auth(adminToken));
    expect(liste.status).toBe(200);
    for (const boutique of liste.body.data) {
      expect(boutique).not.toHaveProperty('verification_token');
    }

    const patch = await request(app)
      .patch(`/api/backoffice/stores/${maBoutique.id}/pipeline`)
      .set(auth(adminToken))
      .send({ pipeline_notes: 'Vérification du masquage.' });
    expect(patch.status).toBe(200);
    expect(patch.body.data).not.toHaveProperty('verification_token');
  });

  it('refuse la liste des boutiques à un commerçant', async () => {
    const res = await request(app).get('/api/backoffice/stores').set(auth(commerçantToken));
    expect(res.status).toBe(403);
  });
});
