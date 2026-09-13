/**
 * Jeu de données de démarrage : un compte de chaque rôle, un magasin vérifié,
 * un catalogue réaliste. Idempotent — relançable sans dupliquer.
 *
 *   npm run seed
 */
import { PrismaClient } from '@prisma/client';
import { derivedFields } from '../src/entities/derived.js';
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

  // Trois boutiques : sans quoi la facette « boutique » n'a rien à montrer et
  // les écarts de prix entre enseignes ne se voient pas.
  const autresBoutiques = [
    {
      id: 'seed-store-2',
      name: 'Marché Mokolo — Étal Nkolo',
      address: 'Marché Mokolo, allée C',
      city: 'Yaoundé',
      latitude: 3.8778,
      longitude: 11.5061,
    },
    {
      id: 'seed-store-3',
      name: 'Alimentation Akwa Palace',
      address: 'Boulevard de la Liberté, Akwa',
      city: 'Douala',
      latitude: 4.0483,
      longitude: 9.7043,
    },
  ];

  const boutiques = [store];
  for (const boutique of autresBoutiques) {
    boutiques.push(
      await prisma.store.upsert({
        where: { id: boutique.id },
        update: {},
        create: {
          ...boutique,
          phone: '+237233000002',
          owner_email: partner.email,
          status: 'verified',
          is_partner: true,
          opening_hours: '07h00 – 20h00',
        },
      }),
    );
  }

  const catalogue = [
    { name: 'Yaourt nature 1 L', brand: 'Camlait', category: 'produits_laitiers', original_price: 1500, discounted_price: 900, weight: 1, weight_unit: 'L', jours: 2, tags: ['yaourt', 'frais'] },
    { name: 'Lait concentré sucré 397 g', brand: 'Nestlé', category: 'produits_laitiers', original_price: 1100, discounted_price: 750, weight: 397, weight_unit: 'g', jours: 45, tags: ['lait'] },
    { name: 'Fromage fondu 8 portions', brand: 'La Vache qui rit', category: 'produits_laitiers', original_price: 2200, discounted_price: 1400, weight: 140, weight_unit: 'g', jours: 5, tags: ['fromage'] },
    { name: 'Pain de mie complet', brand: 'Boulangerie du Centre', category: 'boulangerie', original_price: 1200, discounted_price: 600, weight: 500, weight_unit: 'g', jours: 1, tags: ['pain'] },
    { name: 'Croissants au beurre (x6)', brand: 'Boulangerie du Centre', category: 'boulangerie', original_price: 1800, discounted_price: 700, weight: 360, weight_unit: 'g', jours: 0, tags: ['viennoiserie'] },
    { name: 'Baguette tradition', brand: 'Boulangerie du Centre', category: 'boulangerie', original_price: 300, discounted_price: 150, weight: 250, weight_unit: 'g', jours: 0, tags: ['pain'] },
    { name: 'Tomates fraîches (1 kg)', brand: null, category: 'fruits_legumes', original_price: 1000, discounted_price: 650, weight: 1, weight_unit: 'kg', jours: 3, tags: ['tomate', 'legume'] },
    { name: 'Bananes plantains (2 kg)', brand: null, category: 'fruits_legumes', original_price: 1500, discounted_price: 900, weight: 2, weight_unit: 'kg', jours: 4, tags: ['plantain'] },
    { name: 'Ananas Victoria', brand: null, category: 'fruits_legumes', original_price: 1200, discounted_price: 700, weight: 1.4, weight_unit: 'kg', jours: 2, tags: ['ananas', 'fruit'] },
    { name: 'Avocats mûrs (x4)', brand: null, category: 'fruits_legumes', original_price: 1600, discounted_price: 800, weight: 800, weight_unit: 'g', jours: 1, tags: ['avocat'] },
    { name: 'Filet de poulet (800 g)', brand: 'Ferme du Mbam', category: 'viandes_poissons', original_price: 4500, discounted_price: 2900, weight: 800, weight_unit: 'g', jours: 2, tags: ['poulet', 'viande'] },
    { name: 'Maquereaux frais (1 kg)', brand: null, category: 'viandes_poissons', original_price: 3800, discounted_price: 2200, weight: 1, weight_unit: 'kg', jours: 1, tags: ['poisson'] },
    { name: 'Émincé de bœuf (500 g)', brand: 'Ferme du Mbam', category: 'viandes_poissons', original_price: 5200, discounted_price: 3600, weight: 500, weight_unit: 'g', jours: 3, tags: ['boeuf', 'viande'] },
    { name: 'Jus d’ananas 1 L', brand: 'Top', category: 'boissons', original_price: 1800, discounted_price: 1200, weight: 1, weight_unit: 'L', jours: 6, tags: ['jus'] },
    { name: 'Eau minérale pack 6 × 1,5 L', brand: 'Source du Pays', category: 'boissons', original_price: 2400, discounted_price: 1900, weight: 9, weight_unit: 'L', jours: 200, tags: ['eau'] },
    { name: 'Jus d’orange 1 L', brand: 'Top', category: 'boissons', original_price: 1700, discounted_price: 1100, weight: 1, weight_unit: 'L', jours: 8, tags: ['jus', 'orange'] },
    { name: 'Riz parfumé 5 kg', brand: 'Mahima', category: 'epicerie', original_price: 7000, discounted_price: 5600, weight: 5, weight_unit: 'kg', jours: 120, tags: ['riz'] },
    { name: 'Huile de palme raffinée 1 L', brand: 'Azur', category: 'epicerie', original_price: 2000, discounted_price: 1500, weight: 1, weight_unit: 'L', jours: 90, tags: ['huile'] },
    { name: 'Spaghetti 500 g', brand: 'Panzani', category: 'epicerie', original_price: 900, discounted_price: 550, weight: 500, weight_unit: 'g', jours: 60, tags: ['pates'] },
    { name: 'Farine de blé 1 kg', brand: 'Mahima', category: 'epicerie', original_price: 1100, discounted_price: 800, weight: 1, weight_unit: 'kg', jours: 40, tags: ['farine'] },
    { name: 'Petits pois en conserve 400 g', brand: 'Nestlé', category: 'conserves', original_price: 950, discounted_price: 600, weight: 400, weight_unit: 'g', jours: 30, tags: ['conserve'] },
    { name: 'Concentré de tomate 800 g', brand: 'Azur', category: 'conserves', original_price: 1400, discounted_price: 950, weight: 800, weight_unit: 'g', jours: 25, tags: ['tomate', 'conserve'] },
    { name: 'Sardines à l’huile 125 g', brand: 'Azur', category: 'conserves', original_price: 700, discounted_price: 400, weight: 125, weight_unit: 'g', jours: 20, tags: ['sardine'] },
    { name: 'Cube bouillon (x60)', brand: 'Maggi', category: 'condiments', original_price: 1300, discounted_price: 900, weight: 240, weight_unit: 'g', jours: 70, tags: ['bouillon'] },
    { name: 'Piment en poudre 100 g', brand: null, category: 'condiments', original_price: 600, discounted_price: 350, weight: 100, weight_unit: 'g', jours: 50, tags: ['piment', 'epice'] },
    { name: 'Mayonnaise 450 g', brand: 'Azur', category: 'condiments', original_price: 1800, discounted_price: 1100, weight: 450, weight_unit: 'g', jours: 12, tags: ['sauce'] },
    { name: 'Poisson pané surgelé 400 g', brand: 'Océane', category: 'surgeles', original_price: 3200, discounted_price: 1900, weight: 400, weight_unit: 'g', jours: 15, tags: ['surgele', 'poisson'] },
    { name: 'Légumes mélangés surgelés 1 kg', brand: 'Océane', category: 'surgeles', original_price: 2600, discounted_price: 1700, weight: 1, weight_unit: 'kg', jours: 18, tags: ['surgele', 'legume'] },
    { name: 'Savon de ménage (x4)', brand: 'Éclat', category: 'hygiene', original_price: 1200, discounted_price: 800, weight: 800, weight_unit: 'g', jours: 200, tags: ['savon'] },
    { name: 'Gel douche 750 mL', brand: 'Éclat', category: 'hygiene', original_price: 2400, discounted_price: 1500, weight: 750, weight_unit: 'mL', jours: 150, tags: ['douche'] },
  ];

  /*
   * Chaque référence est mise en vente dans deux boutiques sur trois, à des
   * prix et des dates différents. Le catalogue de démonstration a ainsi de
   * quoi remplir plusieurs pages, plusieurs marques et plusieurs enseignes —
   * sans cela, ni la pagination ni les facettes ne se voient à l'écran.
   */
  let rang = 0;
  for (const [index, item] of catalogue.entries()) {
    for (const décalage of [0, 1]) {
      const boutique = boutiques[(index + décalage) % boutiques.length];
      rang += 1;

      const variation = décalage === 0 ? 1 : 1.08;
      const original = Math.round((item.original_price * variation) / 50) * 50;
      const remisé = Math.round((item.discounted_price * variation) / 50) * 50;
      const { tags, jours: dansJours, ...champs } = item;

      const données = {
        ...champs,
        tags: tags ?? [],
        original_price: original,
        discounted_price: remisé,
        expiration_date: day(Math.max(0, dansJours + décalage)),
        quantity_available: 3 + ((index * 3 + décalage * 5) % 18),
        quantity_sold: (index * 7) % 40,
        avg_rating: Math.round((3.2 + ((index * 7 + décalage) % 19) / 10) * 10) / 10,
        reviews_count: (index * 5 + décalage * 3) % 47,
        store_id: boutique.id,
        store_name: boutique.name,
        store_location: boutique.city,
        is_verified: (index + décalage) % 7 !== 0,
        status: 'active',
      };

      await prisma.product.upsert({
        where: { id: `seed-product-${rang}` },
        update: { quantity_available: données.quantity_available, status: 'active' },
        create: { id: `seed-product-${rang}`, ...données, ...derivedFields('Product', données) },
      });
    }
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
