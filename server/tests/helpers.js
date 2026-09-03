import request from 'supertest';
import argon2 from 'argon2';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

export const app = createApp();

const PASSWORD = 'motdepasse-de-test-123';

/** Vide les tables métier entre deux fichiers de test. */
export async function resetDatabase() {
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  const list = tables.map((t) => `"${t.tablename}"`).join(', ');
  if (list) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export async function createUser(email, overrides = {}) {
  return prisma.user.create({
    data: {
      email,
      full_name: email.split('@')[0],
      password_hash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
      phone: '+237699000000',
      ...overrides,
    },
  });
}

export async function login(email) {
  const response = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  if (response.status !== 200) {
    throw new Error(`connexion impossible pour ${email} : ${response.status} ${response.text}`);
  }
  return response.body.access_token;
}

export const auth = (token) => ({ Authorization: `Bearer ${token}` });

export async function createStore(ownerEmail, overrides = {}) {
  return prisma.store.create({
    data: {
      name: 'Magasin de test',
      address: 'Rue de test',
      city: 'Yaoundé',
      owner_email: ownerEmail,
      status: 'verified',
      is_partner: true,
      ...overrides,
    },
  });
}

export async function createProduct(storeId, overrides = {}) {
  return prisma.product.create({
    data: {
      name: 'Produit de test',
      category: 'epicerie',
      original_price: 2000,
      discounted_price: 1200,
      quantity_available: 10,
      expiration_date: new Date(Date.now() + 2 * 86_400_000),
      store_id: storeId,
      store_name: 'Magasin de test',
      status: 'active',
      weight: 1,
      weight_unit: 'kg',
      ...overrides,
    },
  });
}
