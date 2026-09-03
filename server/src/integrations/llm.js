import { env } from '../config/env.js';
import { HttpError } from '../lib/errors.js';

/**
 * Appel de modèle de langage, centralisé côté serveur pour que la clé d'API ne
 * transite jamais par le navigateur. Le schéma JSON attendu est transmis comme
 * outil : la réponse est structurée, jamais du texte libre à parser.
 */
export async function invokeLLM({ prompt, jsonSchema, system, maxTokens = 2048 }) {
  if (env.LLM_PROVIDER === 'none' || !env.ANTHROPIC_API_KEY) {
    throw new HttpError(503, "L'assistance IA n'est pas activée sur cette instance", {
      code: 'llm_disabled',
    });
  }

  const body = {
    model: env.LLM_MODEL,
    max_tokens: maxTokens,
    system: system ?? "Tu réponds en français, de façon concise et actionnable.",
    messages: [{ role: 'user', content: prompt }],
  };

  if (jsonSchema) {
    body.tools = [
      {
        name: 'repondre',
        description: 'Renvoie la réponse structurée attendue.',
        input_schema: jsonSchema,
      },
    ];
    body.tool_choice = { type: 'tool', name: 'repondre' };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new HttpError(502, "Le service d'IA est indisponible", {
      code: 'llm_error',
      details: detail.slice(0, 500),
    });
  }

  const payload = await response.json();

  if (jsonSchema) {
    const toolUse = payload.content?.find((c) => c.type === 'tool_use');
    if (!toolUse) throw new HttpError(502, "Réponse IA inexploitable", { code: 'llm_error' });
    return toolUse.input;
  }

  return payload.content?.filter((c) => c.type === 'text').map((c) => c.text).join('\n') ?? '';
}
