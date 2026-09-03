import { env } from '../config/env.js';

/**
 * Client S3 minimal chargé à la demande, pour ne pas imposer la dépendance AWS
 * aux installations qui stockent en local.
 */
export function S3Client() {
  return {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  };
}

export async function Upload() {
  throw new Error(
    "Stockage S3 non câblé : installez @aws-sdk/client-s3 puis complétez src/integrations/s3.js",
  );
}
