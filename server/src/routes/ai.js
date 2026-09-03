import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { handler } from '../lib/async-handler.js';
import { badRequest, forbidden } from '../lib/errors.js';
import { requireAuth } from '../auth/middleware.js';
import { invokeLLM } from '../integrations/llm.js';
import { prisma } from '../lib/prisma.js';
import { withStoreContext } from '../access/context.js';
import { urgencyFor } from '../domain/pricing.js';

export const aiRouter = Router();

// Les appels de modèle sont facturés : ils sont limités par utilisateur.
const limiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: "Trop de demandes à l'assistant. Patientez un instant." } },
});

aiRouter.use(requireAuth, limiter);

// --- Fragments de schéma réutilisés ----------------------------------------
const str = { type: 'string' };
const num = { type: 'number' };
const arrayOf = (items) => ({ type: 'array', items });
const objectOf = (properties, required = []) => ({ type: 'object', properties, required });

/**
 * Catalogue des usages IA.
 *
 * Chaque tâche déclare ses paramètres, construit **elle-même** son contexte
 * depuis la base, et impose un schéma de sortie. Le navigateur ne compose
 * jamais de prompt : il ne peut donc ni détourner le modèle, ni faire lire au
 * serveur des données auxquelles l'utilisateur n'a pas droit.
 */
const TASKS = {
  recipe_from_ingredients: {
    input: z.object({
      ingredients: z.array(z.string().max(80)).min(1).max(30),
      servings: z.number().int().min(1).max(12).default(4),
    }),
    build: ({ ingredients, servings }) => ({
      prompt: `Propose une recette anti-gaspillage pour ${servings} personnes à partir de : ${ingredients.join(', ')}. Cuisine africaine, contexte camerounais, ingrédients proches de leur date limite.`,
      jsonSchema: objectOf(
        {
          title: str,
          description: str,
          prep_time: num,
          cook_time: num,
          servings: num,
          difficulty: { type: 'string', enum: ['facile', 'moyen', 'difficile'] },
          estimated_cost: num,
          ingredients: arrayOf(objectOf({ name: str, quantity: str }, ['name'])),
          steps: arrayOf(str),
        },
        ['title', 'ingredients', 'steps'],
      ),
    }),
  },

  recipe_analysis: {
    input: z.object({ recipe: z.string().min(10).max(4000) }),
    build: ({ recipe }) => ({
      prompt: `Analyse cette recette et propose des améliorations santé et budget, sans dénaturer le plat.\n\nRecette :\n${recipe}`,
      jsonSchema: objectOf(
        {
          health_score: num,
          cost_score: num,
          health_improvements: arrayOf(str),
          cost_improvements: arrayOf(str),
          suggestions: arrayOf(objectOf({ original: str, replacement: str, reason: str }, ['original', 'replacement'])),
        },
        ['health_score', 'cost_score', 'suggestions'],
      ),
    }),
  },

  ingredient_alternatives: {
    input: z.object({ ingredient: z.string().min(2).max(80) }),
    build: ({ ingredient }) => ({
      prompt: `Propose des alternatives à « ${ingredient} » : plus économiques, plus saines, disponibles au Cameroun.`,
      jsonSchema: objectOf(
        {
          alternatives: arrayOf(
            objectOf(
              { name: str, category: { type: 'string', enum: ['economique', 'sante', 'local'] }, description: str },
              ['name', 'category'],
            ),
          ),
        },
        ['alternatives'],
      ),
    }),
  },

  meal_plan: {
    input: z.object({
      days: z.number().int().min(1).max(7),
      budget_xaf: z.number().int().min(0).max(1_000_000),
      servings: z.number().int().min(1).max(12).default(4),
    }),
    /** Le régime et les allergènes viennent du profil, pas du corps de la requête. */
    context: async (user) => {
      const pref = await prisma.userPreference.findFirst({ where: { user_email: user.email } });
      return {
        dietary: pref?.dietary_preferences ?? user.dietary_preferences ?? [],
        allergens: pref?.allergens_to_avoid ?? user.allergens_to_avoid ?? [],
      };
    },
    build: ({ days, budget_xaf, servings }, { dietary, allergens }) => ({
      prompt: `Établis un plan de repas sur ${days} jour(s) pour ${servings} personnes, budget ${budget_xaf} FCFA, au Cameroun.${
        dietary.length ? ` Régime : ${dietary.join(', ')}.` : ''
      }${allergens.length ? ` À éviter absolument : ${allergens.join(', ')}.` : ''} Privilégie les produits anti-gaspillage.`,
      jsonSchema: objectOf(
        {
          days: arrayOf(
            objectOf(
              {
                day: str,
                meals: arrayOf(objectOf({ moment: str, title: str, estimated_cost: num }, ['moment', 'title'])),
              },
              ['day', 'meals'],
            ),
          ),
          total_estimated_cost: num,
        },
        ['days'],
      ),
    }),
  },

  cart_suggestions: {
    input: z.object({}).default({}),
    /** Le panier est relu en base : le client ne décrit pas son propre contenu. */
    context: async (user) => {
      const items = await prisma.cartItem.findMany({ where: { user_email: user.email }, take: 50 });
      const products = await prisma.product.findMany({
        where: { status: 'active', quantity_available: { gt: 0 } },
        orderBy: { expiration_date: 'asc' },
        take: 30,
        select: { name: true, category: true, discounted_price: true, original_price: true, store_name: true },
      });
      return { items, products };
    },
    build: (_input, { items, products }) => {
      if (!items.length) throw badRequest('Votre panier est vide');
      return {
        prompt: `Panier actuel :\n${items.map((i) => `- ${i.product_name} × ${i.quantity} à ${i.unit_price} FCFA`).join('\n')}\n\nProduits anti-gaspillage disponibles :\n${products
          .map((p) => `- ${p.name} (${p.category}) ${p.discounted_price} FCFA au lieu de ${p.original_price}, ${p.store_name}`)
          .join('\n')}\n\nPropose des compléments pertinents et des économies possibles.`,
        jsonSchema: objectOf(
          {
            suggestions: arrayOf(objectOf({ product_name: str, reason: str, estimated_saving: num }, ['product_name', 'reason'])),
            tips: arrayOf(str),
          },
          ['suggestions'],
        ),
      };
    },
  },

  partner_assistant: {
    input: z.object({ question: z.string().min(2).max(1000) }),
    /** Le contexte est celui des magasins de l'utilisateur, et d'eux seuls. */
    context: async (user, req) => {
      const storeIds = await withStoreContext(req);
      if (!storeIds.length) throw forbidden("Aucun magasin n'est rattaché à votre compte");

      const now = new Date();
      const [products, orders] = await Promise.all([
        prisma.product.findMany({ where: { store_id: { in: storeIds }, status: 'active' }, take: 60 }),
        prisma.order.aggregate({
          where: {
            store_id: { in: storeIds },
            created_date: { gte: new Date(now.getTime() - 30 * 86_400_000) },
            status: { not: 'cancelled' },
          },
          _sum: { total_amount: true },
          _count: true,
        }),
      ]);

      return {
        products: products.map((p) => ({
          nom: p.name,
          categorie: p.category,
          stock: p.quantity_available,
          prix: p.discounted_price,
          urgence: urgencyFor(p.expiration_date, now).urgency,
          jours_restants: urgencyFor(p.expiration_date, now).daysLeft,
        })),
        revenue_30j: orders._sum.total_amount ?? 0,
        commandes_30j: orders._count,
      };
    },
    build: ({ question }, context) => ({
      system:
        "Tu es l'assistant anti-gaspillage d'un supermarché camerounais. Tu réponds en français, avec des chiffres précis en FCFA et des actions concrètes. Tu ne t'appuies que sur les données fournies ; si une information manque, tu le dis.",
      prompt: `Données du magasin :\n${JSON.stringify(context, null, 2)}\n\nQuestion du partenaire : ${question}`,
      jsonSchema: objectOf(
        {
          answer: str,
          actions: arrayOf(objectOf({ label: str, detail: str, impact_xaf: num }, ['label'])),
        },
        ['answer'],
      ),
    }),
  },

  partner_restock_advice: {
    input: z.object({}).default({}),
    context: async (user, req) => {
      const storeIds = await withStoreContext(req);
      if (!storeIds.length) throw forbidden("Aucun magasin n'est rattaché à votre compte");

      const products = await prisma.product.findMany({
        where: { store_id: { in: storeIds } },
        orderBy: { quantity_sold: 'desc' },
        take: 40,
        select: { name: true, category: true, quantity_sold: true, quantity_available: true, discounted_price: true },
      });
      return { products };
    },
    build: (_input, { products }) => ({
      prompt: `Historique produits du magasin :\n${products
        .map((p) => `- ${p.name} (${p.category}) : ${p.quantity_sold} vendus, ${p.quantity_available} en stock, ${p.discounted_price} FCFA`)
        .join('\n')}\n\nRecommande 5 produits à réapprovisionner ou à mettre en avant, avec justification chiffrée.`,
      jsonSchema: objectOf(
        {
          recommendations: arrayOf(
            objectOf(
              { product_name: str, category: str, reason: str, suggested_quantity: num, expected_revenue: num },
              ['product_name', 'reason'],
            ),
          ),
        },
        ['recommendations'],
      ),
    }),
  },

  route_optimization: {
    input: z.object({ order_ids: z.array(z.string()).min(1).max(40) }),
    /** Seules les commandes que le livreur a le droit de voir entrent dans le calcul. */
    context: async (user, req) => {
      if (!user.is_delivery_driver && user.role !== 'admin') {
        throw forbidden('Réservé aux livreurs');
      }
      const ids = req.body?.order_ids ?? [];
      const orders = await prisma.order.findMany({
        where: { id: { in: ids }, delivery_type: 'delivery', status: { in: ['confirmed', 'ready'] } },
        select: { id: true, delivery_address: true, customer_name: true, store_name: true, total_amount: true },
      });
      return { orders };
    },
    build: (_input, { orders }) => {
      if (!orders.length) throw badRequest('Aucune commande livrable dans cette sélection');
      return {
        prompt: `Optimise cette tournée de livraison à Yaoundé/Douala. Commandes :\n${orders
          .map((o, i) => `${i + 1}. ${o.delivery_address ?? 'adresse manquante'} — ${o.customer_name ?? ''} (réf ${o.id})`)
          .join('\n')}\n\nDonne l'ordre de passage, la distance et la durée estimées.`,
        jsonSchema: objectOf(
          {
            stops: arrayOf(
              objectOf({ order_id: str, position: num, address: str, estimated_minutes: num }, ['order_id', 'position']),
            ),
            total_distance_km: num,
            total_duration_minutes: num,
            notes: arrayOf(str),
          },
          ['stops'],
        ),
      };
    },
  },

  product_recommendations: {
    input: z.object({ limit: z.number().int().min(1).max(12).default(6) }),
    context: async (user) => {
      const [pref, interactions, products] = await Promise.all([
        prisma.userPreference.findFirst({ where: { user_email: user.email } }),
        prisma.userInteraction.findMany({
          where: { user_email: user.email, item_type: 'product' },
          orderBy: { created_date: 'desc' },
          take: 20,
        }),
        prisma.product.findMany({
          where: { status: 'active', quantity_available: { gt: 0 } },
          orderBy: { expiration_date: 'asc' },
          take: 40,
          select: { id: true, name: true, category: true, discounted_price: true, original_price: true, store_name: true },
        }),
      ]);
      return {
        categories: pref?.favorite_categories ?? [],
        allergens: pref?.allergens_to_avoid ?? [],
        recent: interactions.map((i) => i.category).filter(Boolean),
        products,
      };
    },
    build: ({ limit }, { categories, allergens, recent, products }) => ({
      prompt: `Profil : catégories préférées ${categories.join(', ') || 'non renseignées'} ; à éviter ${allergens.join(', ') || 'rien'} ; consultations récentes ${recent.join(', ') || 'aucune'}.\n\nProduits disponibles :\n${products
        .map((p) => `- [${p.id}] ${p.name} (${p.category}) ${p.discounted_price} FCFA au lieu de ${p.original_price}, ${p.store_name}`)
        .join('\n')}\n\nSélectionne les ${limit} produits les plus pertinents pour ce profil.`,
      jsonSchema: objectOf(
        {
          recommendations: arrayOf(objectOf({ product_id: str, reason: str, match_score: num }, ['product_id', 'reason'])),
        },
        ['recommendations'],
      ),
    }),
  },
};

export const taskNames = Object.keys(TASKS);

aiRouter.post(
  '/:task',
  handler(async (req, res) => {
    const task = TASKS[req.params.task];
    if (!task) throw badRequest(`Tâche inconnue : ${req.params.task}`);

    const parsed = task.input.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequest('Paramètres invalides', parsed.error.issues);

    const context = task.context ? await task.context(req.user, req) : null;
    const { prompt, jsonSchema, system } = task.build(parsed.data, context);

    res.json({ data: await invokeLLM({ prompt, jsonSchema, system }) });
  }),
);
