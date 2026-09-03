/**
 * Jeu de données de démarrage : un compte de chaque rôle, un magasin vérifié,
 * un catalogue réaliste. Idempotent — relançable sans dupliquer.
 *
 *   npm run seed
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'chichard-demo-2026';

const day = (offset) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

async function upsertUser(email, data) {
  const password_hash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
  return prisma.user.upsert({
    where: { email },
    update: data,
    create: { email, password_hash, ...data },
  });
}

async function main() {
  const admin = await upsertUser('admin@chichard.cm', {
    full_name: 'Administration Chichard',
    role: 'admin',
    backoffice_role: 'super_admin',
    city: 'Yaoundé',
    phone: '+237699000001',
  });

  const partner = await upsertUser('partenaire@chichard.cm', {
    full_name: 'Awono Marie',
    is_partner: true,
    city: 'Yaoundé',
    phone: '+237699000002',
  });

  const driver = await upsertUser('livreur@chichard.cm', {
    full_name: 'Nkolo Jean',
    is_delivery_driver: true,
    city: 'Yaoundé',
    phone: '+237699000003',
  });

  const customer = await upsertUser('client@chichard.cm', {
    full_name: 'Bekolo Sandrine',
    city: 'Douala',
    phone: '+237699000004',
    address: 'Akwa, rue Joss',
    loyalty_points: 750,
    waste_avoided_kg: 12.4,
  });

  const store = await prisma.store.upsert({
    where: { id: 'seed-store-1' },
    update: {},
    create: {
      id: 'seed-store-1',
      name: 'Supermarché Le Bosquet',
      address: 'Avenue Kennedy, Bastos',
      city: 'Yaoundé',
      phone: '+237233000001',
      email: 'contact@lebosquet.cm',
      owner_email: partner.email,
      status: 'verified',
      is_partner: true,
      latitude: 3.8891,
      longitude: 11.5203,
      opening_hours: '08h00 – 21h00',
      stock_alert_settings: { low_stock_threshold: 5, enable_email_alerts: true },
    },
  });

  await prisma.user.update({ where: { id: partner.id }, data: { store_id: store.id } });

  const catalogue = [
    { name: 'Yaourt nature 1 L', category: 'produits_laitiers', original_price: 1500, discounted_price: 900, quantity_available: 12, expiration_date: day(2), weight: 1, weight_unit: 'L' },
    { name: 'Pain de mie complet', category: 'boulangerie', original_price: 1200, discounted_price: 600, quantity_available: 6, expiration_date: day(1), weight: 500, weight_unit: 'g' },
    { name: 'Tomates fraîches (1 kg)', category: 'fruits_legumes', original_price: 1000, discounted_price: 650, quantity_available: 20, expiration_date: day(3), weight: 1, weight_unit: 'kg' },
    { name: 'Filet de poulet (800 g)', category: 'viandes_poissons', original_price: 4500, discounted_price: 2900, quantity_available: 4, expiration_date: day(2), weight: 800, weight_unit: 'g' },
    { name: 'Jus d’ananas 1 L', category: 'boissons', original_price: 1800, discounted_price: 1200, quantity_available: 15, expiration_date: day(6), weight: 1, weight_unit: 'L' },
    { name: 'Riz parfumé 5 kg', category: 'epicerie', original_price: 7000, discounted_price: 5600, quantity_available: 8, expiration_date: day(120), weight: 5, weight_unit: 'kg' },
  ];

  for (const [index, item] of catalogue.entries()) {
    await prisma.product.upsert({
      where: { id: `seed-product-${index + 1}` },
      update: { quantity_available: item.quantity_available, status: 'active' },
      create: {
        id: `seed-product-${index + 1}`,
        ...item,
        store_id: store.id,
        store_name: store.name,
        store_location: store.city,
        status: 'active',
      },
    });
  }

  await prisma.clickCollectBasket.upsert({
    where: { id: 'seed-basket-1' },
    update: { quantity_available: 10, quantity_reserved: 0, status: 'active', pickup_date: day(1) },
    create: {
      id: 'seed-basket-1',
      store_id: store.id,
      store_name: store.name,
      store_address: store.address,
      basket_type: 'surprise_basket',
      name: 'Panier surprise du soir',
      description: 'Fruits, légumes et produits frais du jour.',
      original_price: 6000,
      discounted_price: 2500,
      quantity_available: 10,
      pickup_date: day(1),
      pickup_slots: ['18h00 – 19h00', '19h00 – 20h00'],
      category: 'fruits_legumes',
      weight_kg: 3,
      co2_saved_kg: 7.5,
      status: 'active',
    },
  });

  await prisma.loyaltyReward.upsert({
    where: { id: 'seed-reward-1' },
    update: {},
    create: {
      id: 'seed-reward-1',
      title: 'Bon de 1 000 FCFA',
      description: 'Utilisable dès 5 000 FCFA d’achat.',
      points_required: 500,
      reward_type: 'discount',
      reward_value: 1000,
      is_active: true,
    },
  });

  await prisma.chatRoom.upsert({
    where: { id: 'seed-room-1' },
    update: {},
    create: { id: 'seed-room-1', name: 'Bons plans', category: 'bons_plans', type: 'public', is_active: true },
  });

  console.log(`Jeu de données prêt. Mot de passe commun : ${DEMO_PASSWORD}`);
  console.table([admin, partner, driver, customer].map((u) => ({ email: u.email, role: u.role })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
