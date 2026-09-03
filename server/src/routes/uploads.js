import { Router } from 'express';
import { handler } from '../lib/async-handler.js';
import { badRequest } from '../lib/errors.js';
import { requireAuth } from '../auth/middleware.js';
import { MAX_UPLOAD_BYTES, storeUpload } from '../integrations/storage.js';

export const uploadsRouter = Router();

/**
 * Téléversement en flux : le corps de la requête est écrit directement sur le
 * stockage, sans passer par un fichier temporaire ni par la mémoire.
 * Le type est déclaré par `Content-Type` et validé contre une liste fermée.
 */
uploadsRouter.post(
  '/',
  requireAuth,
  handler(async (req, res) => {
    const mimeType = req.get('content-type')?.split(';')[0]?.trim();
    if (!mimeType) throw badRequest('En-tête Content-Type manquant');

    const declared = Number(req.get('content-length') ?? 0);
    if (declared > MAX_UPLOAD_BYTES) {
      throw badRequest(`Fichier trop volumineux (maximum ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo)`);
    }

    let received = 0;
    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > MAX_UPLOAD_BYTES) req.destroy();
    });

    const result = await storeUpload({
      stream: req,
      mimeType,
      originalName: req.get('x-file-name'),
    });

    res.status(201).json({ data: { file_url: result.url, key: result.key } });
  }),
);
