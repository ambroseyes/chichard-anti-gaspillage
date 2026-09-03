import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { extname, join, resolve } from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { badRequest } from '../lib/errors.js';

const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
  ['application/pdf', '.pdf'],
]);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Écrit un fichier téléversé et renvoie son URL publique.
 * Le nom est réattribué côté serveur : aucun chemin fourni par le client n'est
 * utilisé, ce qui ferme la traversée de répertoire.
 */
export async function storeUpload({ stream, mimeType, originalName }) {
  const extension = ALLOWED.get(mimeType) ?? extname(originalName ?? '').toLowerCase();
  if (!ALLOWED.has(mimeType)) {
    throw badRequest(`Type de fichier non autorisé : ${mimeType}`);
  }

  const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;

  if (env.STORAGE_DRIVER === 'local') {
    const target = resolve(env.STORAGE_LOCAL_DIR, key);
    await mkdir(join(target, '..'), { recursive: true });
    await pipeline(stream, createWriteStream(target));
    return { key, url: `${env.PUBLIC_BASE_URL}/uploads/${key}` };
  }

  // Chemin S3 : compatible MinIO / Scaleway / Wasabi.
  const { S3Client, Upload } = await import('./s3.js');
  const client = S3Client();
  await Upload(client, { key, body: stream, contentType: mimeType });
  return { key, url: `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}` };
}
