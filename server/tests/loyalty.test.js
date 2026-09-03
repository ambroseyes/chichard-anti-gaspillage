import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { app, auth, createUser, login, resetDatabase } from './helpers.js';

describe('fidélité', () => {
  let token;
  let user;
  let reward;

  beforeEach(async () => {
    await resetDatabase();
    user = await createUser('fidele@test.cm', { loyalty_points: 600 });
    reward = await prisma.loyaltyReward.create({
      data: {
        title: 'Bon de 1 000 FCFA',
        points_required: 500,
        reward_type: 'discount',
        reward_value: 1000,
        is_active: true,
      },
    });
    token = await login(user.email);
  });

  afterAll(() => prisma.$disconnect());

  it('débite les points et émet un coupon', async () => {
    const res = await request(app)
      .post('/api/loyalty/redeem')
      .set(auth(token))
      .send({ reward_id: reward.id });

    expect(res.status).toBe(200);
    expect(res.body.data.coupon.value).toBe(1000);

    const apres = await prisma.user.findUnique({ where: { id: user.id } });
    expect(apres.loyalty_points).toBe(100);
  });

  it('refuse un échange sans les points suffisants', async () => {
    await prisma.user.update({ where: { id: user.id }, data: { loyalty_points: 10 } });
    const res = await request(app)
      .post('/api/loyalty/redeem')
      .set(auth(token))
      .send({ reward_id: reward.id });

    expect(res.status).toBe(400);
    expect(await prisma.coupon.count()).toBe(0);
  });

  it('ne débite pas deux fois sur un double envoi', async () => {
    const body = { reward_id: reward.id };
    const [a, b] = await Promise.all([
      request(app).post('/api/loyalty/redeem').set(auth(token)).send(body),
      request(app).post('/api/loyalty/redeem').set(auth(token)).send(body),
    ]);

    expect([a.status, b.status].sort()).toEqual([200, 409]);
    const apres = await prisma.user.findUnique({ where: { id: user.id } });
    expect(apres.loyalty_points).toBe(100);
  });
});
