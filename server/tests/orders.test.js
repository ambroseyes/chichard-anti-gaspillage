import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { app, auth, createProduct, createStore, createUser, login, resetDatabase } from './helpers.js';

describe('parcours de commande', () => {
  let token;
  let user;
  let product;

  beforeEach(async () => {
    await resetDatabase();
    user = await createUser('acheteur@test.cm');
    const partner = await createUser('vendeur@test.cm', { is_partner: true });
    const store = await createStore(partner.email);
    product = await createProduct(store.id, { quantity_available: 3, discounted_price: 1200, original_price: 2000 });

    await prisma.cartItem.create({
      data: {
        user_email: user.email,
        product_id: product.id,
        product_name: product.name,
        quantity: 2,
        unit_price: 1200,
        original_price: 2000,
      },
    });

    token = await login(user.email);
  });

  afterAll(() => prisma.$disconnect());

  it('décrémente le stock et trace le mouvement', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(auth(token))
      .send({ delivery_type: 'pickup', payment_method: 'cash', customer_phone: '+237699000000' });

    expect(res.status).toBe(201);

    const apres = await prisma.product.findUnique({ where: { id: product.id } });
    expect(apres.quantity_available).toBe(1);
    expect(apres.quantity_sold).toBe(2);

    const mouvements = await prisma.stockMovement.findMany({ where: { product_id: product.id } });
    expect(mouvements).toHaveLength(1);
    expect(mouvements[0].movement_type).toBe('out');
    expect(mouvements[0].new_quantity).toBe(1);
  });

  it('facture les frais de livraison annoncés', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(auth(token))
      .send({
        delivery_type: 'delivery',
        delivery_address: 'Akwa, Douala',
        payment_method: 'cash',
        customer_phone: '+237699000000',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.order.subtotal_amount).toBe(2400);
    expect(res.body.data.order.delivery_fee).toBe(1000);
    expect(res.body.data.order.total_amount).toBe(3400);
  });

  it('ignore un prix falsifié dans le panier', async () => {
    // Le client réécrit le prix unitaire de son article : le serveur relit le catalogue.
    await prisma.cartItem.updateMany({
      where: { user_email: user.email },
      data: { unit_price: 1 },
    });

    const res = await request(app)
      .post('/api/orders')
      .set(auth(token))
      .send({ delivery_type: 'pickup', payment_method: 'cash', customer_phone: '+237699000000' });

    expect(res.body.data.order.total_amount).toBe(2400);
  });

  it('ne marque jamais une commande payée sans confirmation opérateur', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set(auth(token))
      .send({ delivery_type: 'pickup', payment_method: 'orange_money', customer_phone: '+237699000000' });

    expect(res.body.data.order.payment_status).toBe('pending');
    expect(res.body.data.order.status).toBe('pending');
  });

  it('refuse de vendre plus que le stock', async () => {
    await prisma.cartItem.updateMany({ where: { user_email: user.email }, data: { quantity: 99 } });

    const res = await request(app)
      .post('/api/orders')
      .set(auth(token))
      .send({ delivery_type: 'pickup', payment_method: 'cash', customer_phone: '+237699000000' });

    expect(res.status).toBe(409);
    const apres = await prisma.product.findUnique({ where: { id: product.id } });
    expect(apres.quantity_available).toBe(3);
  });

  it('vide le panier et crédite les points', async () => {
    await request(app)
      .post('/api/orders')
      .set(auth(token))
      .send({ delivery_type: 'pickup', payment_method: 'cash', customer_phone: '+237699000000' });

    expect(await prisma.cartItem.count({ where: { user_email: user.email } })).toBe(0);

    const apres = await prisma.user.findUnique({ where: { id: user.id } });
    expect(apres.loyalty_points).toBe(24); // 2400 FCFA / 100
    expect(apres.total_orders).toBe(1);

    const ledger = await prisma.loyaltyTransaction.findMany({ where: { user_email: user.email } });
    expect(ledger).toHaveLength(1);
    expect(ledger[0].points).toBe(24);
  });

  describe('coupons', () => {
    beforeEach(async () => {
      await prisma.coupon.create({
        data: {
          code: 'PROMO500',
          user_email: user.email,
          type: 'FIXED',
          value: 500,
          status: 'ACTIVE',
          valid_to: new Date(Date.now() + 86_400_000),
        },
      });
    });

    it("applique la remise et consomme le coupon", async () => {
      const res = await request(app)
        .post('/api/orders')
        .set(auth(token))
        .send({
          delivery_type: 'pickup',
          payment_method: 'cash',
          customer_phone: '+237699000000',
          coupon_code: 'PROMO500',
        });

      expect(res.body.data.order.discount_amount).toBe(500);
      expect(res.body.data.order.total_amount).toBe(1900);

      const coupon = await prisma.coupon.findFirst({ where: { code: 'PROMO500' } });
      expect(coupon.status).toBe('USED');
      expect(coupon.redeemed_order_id).toBe(res.body.data.order.id);
    });

    it('annonce dans le devis le total réellement facturé', async () => {
      const devis = await request(app)
        .post('/api/orders/quote')
        .set(auth(token))
        .send({ delivery_type: 'delivery', coupon_code: 'PROMO500' });

      const commande = await request(app)
        .post('/api/orders')
        .set(auth(token))
        .send({
          delivery_type: 'delivery',
          delivery_address: 'Akwa, Douala',
          payment_method: 'cash',
          customer_phone: '+237699000000',
          coupon_code: 'PROMO500',
        });

      expect(commande.body.data.order.total_amount).toBe(devis.body.data.total);
    });

    it("refuse un coupon appartenant à quelqu'un d'autre", async () => {
      const autre = await createUser('autre@test.cm');
      await prisma.coupon.create({
        data: { code: 'PASATOI', user_email: autre.email, type: 'FIXED', value: 5000, status: 'ACTIVE' },
      });

      const res = await request(app)
        .post('/api/orders')
        .set(auth(token))
        .send({
          delivery_type: 'pickup',
          payment_method: 'cash',
          customer_phone: '+237699000000',
          coupon_code: 'PASATOI',
        });

      expect(res.status).toBe(400);
    });
  });

  it('remet le stock en rayon à l’annulation', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set(auth(token))
      .send({ delivery_type: 'pickup', payment_method: 'cash', customer_phone: '+237699000000' });

    const res = await request(app)
      .post(`/api/orders/${created.body.data.order.id}/cancel`)
      .set(auth(token))
      .send({ reason: 'test' });

    expect(res.status).toBe(200);
    const apres = await prisma.product.findUnique({ where: { id: product.id } });
    expect(apres.quantity_available).toBe(3);
  });
});

describe('validation de la remise', () => {
  let clientToken;
  let driverToken;
  let order;
  let code;

  beforeEach(async () => {
    await resetDatabase();
    const user = await createUser('client2@test.cm');
    await createUser('livreur@test.cm', { is_delivery_driver: true });
    const partner = await createUser('vendeur2@test.cm', { is_partner: true });
    const store = await createStore(partner.email);
    const product = await createProduct(store.id);

    await prisma.cartItem.create({
      data: {
        user_email: user.email,
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: 1200,
        original_price: 2000,
      },
    });

    clientToken = await login(user.email);
    driverToken = await login('livreur@test.cm');

    const created = await request(app)
      .post('/api/orders')
      .set(auth(clientToken))
      .send({ delivery_type: 'pickup', payment_method: 'cash', customer_phone: '+237699000000' });

    order = created.body.data.order;
    code = created.body.data.confirmation_code;
  });

  it("refuse un code fabriqué à partir de l'identifiant de commande", async () => {
    const res = await request(app)
      .post(`/api/orders/${order.id}/fulfil`)
      .set(auth(driverToken))
      .send({ token: `ORDER_${order.id}` });

    expect(res.status).toBe(400);
    const apres = await prisma.order.findUnique({ where: { id: order.id } });
    expect(apres.status).toBe('pending');
  });

  it('accepte le code réellement remis au client', async () => {
    const res = await request(app)
      .post(`/api/orders/${order.id}/fulfil`)
      .set(auth(driverToken))
      .send({ code });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('delivered');
    expect(res.body.data.payment_status).toBe('paid'); // espèces encaissées à la remise
  });

  it("refuse qu'un client valide lui-même sa remise", async () => {
    const res = await request(app)
      .post(`/api/orders/${order.id}/fulfil`)
      .set(auth(clientToken))
      .send({ code });

    expect(res.status).toBe(403);
  });
});
