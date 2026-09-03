import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { handler } from '../lib/async-handler.js';
import { badRequest } from '../lib/errors.js';
import { requireAuth } from '../auth/middleware.js';
import { invokeLLM } from '../integrations/llm.js';

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

/**
 * Chaque usage IA est une tâche nommée, avec son schéma de sortie.
 * Le navigateur ne compose jamais de prompt libre : il choisit une tâche et
 * fournit des paramètres validés.
 */
const TASKS = {
  recipe_from_ingredients: {
    input: z.object({ ingredients: z.array(z.string().max(80)).min(1).max(30) }),
    build: ({ ingredients }) => ({
      prompt: `Propose une recette anti-gaspillage à partir de ces ingrédients : ${ingredients.join(', ')}. Contexte : Cameroun, produits proches de leur date limite.`,
      jsonSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          prep_time: { type: 'number' },
          cook_time: { type: 'number' },
          servings: { type: 'number' },
          difficulty: { type: 'string', enum: ['facile', 'moyen', 'difficile'] },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, quantity: { type: 'string' } },
              required: ['name'],
            },
          },
          steps: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'ingredients', 'steps'],
      },
    }),
  },

  ingredient_alternatives: {
    input: z.object({ ingredient: z.string().min(2).max(80) }),
    build: ({ ingredient }) => ({
      prompt: `Propose des alternatives à « ${ingredient} » : plus économiques, plus saines, disponibles au Cameroun.`,
      jsonSchema: {
        type: 'object',
        properties: {
          alternatives: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                category: { type: 'string', enum: ['economique', 'sante', 'local'] },
                description: { type: 'string' },
              },
              required: ['name', 'category'],
            },
          },
        },
        required: ['alternatives'],
      },
    }),
  },

  meal_plan: {
    input: z.object({
      days: z.number().int().min(1).max(7),
      budget_xaf: z.number().int().min(0).max(1_000_000),
      dietary: z.array(z.string().max(40)).max(10).default([]),
    }),
    build: ({ days, budget_xaf, dietary }) => ({
      prompt: `Établis un plan de repas sur ${days} jour(s) pour un budget de ${budget_xaf} FCFA au Cameroun.${
        dietary.length ? ` Contraintes : ${dietary.join(', ')}.` : ''
      } Privilégie les produits anti-gaspillage.`,
      jsonSchema: {
        type: 'object',
        properties: {
          days: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'string' },
                meals: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      moment: { type: 'string' },
                      title: { type: 'string' },
                      estimated_cost: { type: 'number' },
                    },
                    required: ['moment', 'title'],
                  },
                },
              },
              required: ['day', 'meals'],
            },
          },
          total_estimated_cost: { type: 'number' },
        },
        required: ['days'],
      },
    }),
  },
};

aiRouter.post(
  '/:task',
  handler(async (req, res) => {
    const task = TASKS[req.params.task];
    if (!task) throw badRequest(`Tâche inconnue : ${req.params.task}`);

    const parsed = task.input.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequest('Paramètres invalides', parsed.error.issues);

    const { prompt, jsonSchema } = task.build(parsed.data);
    res.json({ data: await invokeLLM({ prompt, jsonSchema }) });
  }),
);
