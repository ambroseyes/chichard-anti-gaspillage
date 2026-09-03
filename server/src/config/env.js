import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const bool = (def) =>
  z
    .enum(['true', 'false'])
    .default(def)
    .transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caractères'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  PICKUP_TOKEN_SECRET: z
    .string()
    .min(32, 'PICKUP_TOKEN_SECRET doit faire au moins 32 caractères'),

  DELIVERY_FEE_XAF: z.coerce.number().nonnegative().default(1000),
  FREE_DELIVERY_THRESHOLD_XAF: z.coerce.number().nonnegative().default(25000),
  CO2_KG_PER_KG_SAVED: z.coerce.number().nonnegative().default(2.5),

  PAYMENT_PROVIDER: z.enum(['manual', 'orange_money', 'mtn_momo']).default('manual'),
  ORANGE_MONEY_BASE_URL: z.string().default(''),
  ORANGE_MONEY_CLIENT_ID: z.string().default(''),
  ORANGE_MONEY_CLIENT_SECRET: z.string().default(''),
  ORANGE_MONEY_MERCHANT_ID: z.string().default(''),
  MTN_MOMO_BASE_URL: z.string().default(''),
  MTN_MOMO_SUBSCRIPTION_KEY: z.string().default(''),
  MTN_MOMO_API_USER: z.string().default(''),
  MTN_MOMO_API_KEY: z.string().default(''),
  PAYMENT_WEBHOOK_SECRET: z.string().default(''),

  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: bool('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  MAIL_FROM: z.string().default('Chichard <no-reply@chichard.cm>'),

  SMS_PROVIDER: z.enum(['none', 'http']).default('none'),
  SMS_API_URL: z.string().default(''),
  SMS_API_KEY: z.string().default(''),
  SMS_SENDER: z.string().default('CHICHARD'),

  LLM_PROVIDER: z.enum(['none', 'anthropic']).default('none'),
  ANTHROPIC_API_KEY: z.string().default(''),
  LLM_MODEL: z.string().default('claude-sonnet-5'),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./var/uploads'),
  PUBLIC_BASE_URL: z.string().default('http://localhost:4000'),
  S3_ENDPOINT: z.string().default(''),
  S3_REGION: z.string().default(''),
  S3_BUCKET: z.string().default(''),
  S3_ACCESS_KEY_ID: z.string().default(''),
  S3_SECRET_ACCESS_KEY: z.string().default(''),

  ENABLE_SCHEDULER: bool('true'),
  TZ: z.string().default('Africa/Douala'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')} : ${i.message}`)
    .join('\n');
  // Un démarrage sans configuration valide échoue immédiatement et bruyamment,
  // plutôt que de partir avec des valeurs implicites.
  throw new Error(`Configuration invalide (.env) :\n${details}`);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
