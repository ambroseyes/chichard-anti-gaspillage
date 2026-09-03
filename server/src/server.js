import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { startScheduler } from './jobs/scheduler.js';

const app = createApp();
const tasks = startScheduler();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'serveur Chichard démarré');
});

/** Arrêt propre : on cesse d'accepter, on laisse finir, puis on ferme la base. */
async function shutdown(signal) {
  logger.info({ signal }, 'arrêt demandé');
  tasks.forEach((task) => task.stop());

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setTimeout(() => {
    logger.warn('arrêt forcé après 15 s');
    process.exit(1);
  }, 15_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'rejet de promesse non géré');
});
