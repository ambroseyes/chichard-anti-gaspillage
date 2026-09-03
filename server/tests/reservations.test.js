import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { app, auth, createStore, createUser, login, resetDatabase } from './helpers.js';

describe('réservation Click & Collect', () => {
  let basket;

  beforeEach(async () => {
    await resetDatabase();
    const partner = await createUser('vendeur@test.cm', { is_partner: true });
    const store = await createStore(partner.email);

    basket = await prisma.clickCollectBasket.create({
      data: {
        store_id: store.id,
        store_name: store.name,
        basket_type: 'surprise_basket',
        name: 'Panier du soir',
        original_price: 6000,
        discounted_price: 2500,
        quantity_available: 1,
        quantity_reserved: 0,
        pickup_date: new Date(Date.now() + 86_400_000),
        pickup_slots: ['18h00 – 19h00'],
        status: 'active',
      },
    });
  });

  afterAll(() => prisma.$disconnect());

  it('renvoie le code de retrait une seule fois et ne le stocke qu’en condensat', async () => {
    await createUser('c1@test.cm');
    const token = await login('c1@test.cm');

    const res = await request(app).post('/api/reservations').set(auth(token)).send({
      basket_id: basket.id,
      pickup_slot: '18h00 – 19h00',
      payment_method: 'cash_on_pickup',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.confirmation_code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(res.body.data.reservation).not.toHaveProperty('confirmation_code');

    const stored = await prisma.clickCollectReservation.findUnique({
      where: { id: res.body.data.reservation.id },
    });
    expect(stored.confirmation_code_hash).toBeTruthy();
    expect(stored.confirmation_code_hash).not.toContain(res.body.data.confirmation_code);
  });

  it("n'attribue jamais le dernier panier deux fois", async () => {
    await createUser('a@test.cm');
    await createUser('b@test.cm');
    const [t1, t2] = await Promise.all([login('a@test.cm'), login('b@test.cm')]);

    const body = { basket_id: basket.id, pickup_slot: '18h00 – 19h00', payment_method: 'cash_on_pickup' };
    const [r1, r2] = await Promise.all([
      request(app).post('/api/reservations').set(auth(t1)).send(body),
      request(app).post('/api/reservations').set(auth(t2)).send(body),
    ]);

    const statuts = [r1.status, r2.status].sort();
    expect(statuts).toEqual([201, 409]);

    const apres = await prisma.clickCollectBasket.findUnique({ where: { id: basket.id } });
    expect(apres.quantity_reserved).toBe(1);
    expect(await prisma.clickCollectReservation.count()).toBe(1);
  });

  it('refuse un créneau qui n’est pas proposé', async () => {
    await createUser('c2@test.cm');
    const token = await login('c2@test.cm');

    const res = await request(app).post('/api/reservations').set(auth(token)).send({
      basket_id: basket.id,
      pickup_slot: '03h00 – 04h00',
      payment_method: 'cash_on_pickup',
    });
    expect(res.status).toBe(400);
  });

  it('ne marque pas la réservation payée sans encaissement', async () => {
    await createUser('c3@test.cm');
    const token = await login('c3@test.cm');

    const res = await request(app).post('/api/reservations').set(auth(token)).send({
      basket_id: basket.id,
      pickup_slot: '18h00 – 19h00',
      payment_method: 'orange_money',
    });
    expect(res.body.data.reservation.payment_status).toBe('pending');
  });
});
