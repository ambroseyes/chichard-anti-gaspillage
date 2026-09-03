import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { resolve } from 'node:path';

import { corsOrigins, env, isProduction } from './config/env.js';
import { logger } from './lib/logger.js';
import { HttpError, notFound } from './lib/errors.js';
import { attachUser } from './auth/middleware.js';

import { authRouter } from './routes/auth.js';
import { entitiesRouter } from './entities/router.js';
import { ordersRouter } from './routes/orders.js';
import { reservationsRouter } from './routes/reservations.js';
import { loyaltyRouter } from './routes/loyalty.js';
import { backofficeRouter } from './routes/backoffice.js';
import { partnerRouter } from './routes/partner.js';
import { paymentsRouter } from './routes/payments.js';
import { realtimeRouter } from './routes/realtime.js';
import { aiRouter } from './routes/ai.js';
import { configRouter } from './routes/config.js';
import { uploadsRouter } from './routes/uploads.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        // Les appels serveur à serveur et les outils sans origine sont acceptés.
        if (!origin || corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origine non autorisée : ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  // Le webhook de paiement lit son corps en brut : il est monté avant le parseur JSON.
  app.use('/api/payments', paymentsRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: (req) =>
        env.NODE_ENV === 'test' ||
        req.path === '/health' ||
        req.path.startsWith('/api/realtime'),
    }),
  );

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  if (env.STORAGE_DRIVER === 'local') {
    app.use('/uploads', express.static(resolve(env.STORAGE_LOCAL_DIR), { maxAge: '30d', index: false }));
  }

  app.use(attachUser);

  app.use('/api/config', configRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/entities', entitiesRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/reservations', reservationsRouter);
  app.use('/api/loyalty', loyaltyRouter);
  app.use('/api/partner', partnerRouter);
  app.use('/api/backoffice', backofficeRouter);
  app.use('/api/realtime', realtimeRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/uploads', uploadsRouter);

  app.use((req, _res, next) => next(notFound(`Route inconnue : ${req.method} ${req.path}`)));

  // Express identifie le middleware d'erreur à sa signature à 4 arguments.
  app.use((error, req, res, _next) => {
    if (error instanceof HttpError) {
      return res.status(error.status).json({
        error: { message: error.message, code: error.code, details: error.details },
      });
    }

    // Erreurs Prisma courantes traduites en réponses lisibles.
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: { message: 'Cette valeur existe déjà', code: 'conflict' } });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Ressource introuvable', code: 'not_found' } });
    }

    req.log?.error({ err: error }, 'erreur non gérée');
    return res.status(500).json({
      error: {
        message: isProduction ? 'Erreur interne du serveur' : error.message,
        code: 'internal_error',
      },
    });
  });

  return app;
}
