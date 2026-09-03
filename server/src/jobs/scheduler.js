import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { checkExpirationAlerts } from './expiration-alerts.js';
import { notifyLowStock } from './low-stock.js';
import { refreshUrgencyLevels } from './urgency.js';
import { purgeExpiredTokens } from './purge.js';

/**
 * Verrou coopératif : avec plusieurs instances du serveur, une seule exécute
 * un job donné sur un créneau donné.
 */
async function withLock(name, ttlMs, fn) {
  const now = new Date();
  const until = new Date(now.getTime() + ttlMs);

  const acquired = await prisma.jobLock.updateMany({
    where: { name, locked_until: { lt: now } },
    data: { locked_until: until },
  });

  if (acquired.count === 0) {
    try {
      await prisma.jobLock.create({ data: { name, locked_until: until } });
    } catch {
      return { skipped: true };
    }
  }

  try {
    const result = await fn();
    await prisma.jobLock.update({
      where: { name },
      data: { locked_until: new Date(), last_run_at: new Date(), last_result: result ?? {} },
    });
    logger.info({ job: name, result }, 'tâche planifiée terminée');
    return result;
  } catch (error) {
    logger.error({ err: error, job: name }, 'tâche planifiée en échec');
    await prisma.jobLock.update({
      where: { name },
      data: { locked_until: new Date(), last_run_at: new Date(), last_result: { error: error.message } },
    });
    throw error;
  }
}

const JOBS = [
  {
    name: 'expiration-alerts',
    // Tous les matins à 9 h, heure de Douala.
    schedule: '0 9 * * *',
    ttlMs: 10 * 60_000,
    run: checkExpirationAlerts,
  },
  {
    name: 'urgency-refresh',
    // Toutes les heures : réévalue urgence et prix conseillés.
    schedule: '15 * * * *',
    ttlMs: 5 * 60_000,
    run: refreshUrgencyLevels,
  },
  {
    name: 'low-stock',
    schedule: '30 * * * *',
    ttlMs: 5 * 60_000,
    run: notifyLowStock,
  },
  {
    name: 'purge-tokens',
    schedule: '0 3 * * *',
    ttlMs: 5 * 60_000,
    run: purgeExpiredTokens,
  },
];

export function startScheduler() {
  if (!env.ENABLE_SCHEDULER) {
    logger.info('ordonnanceur désactivé (ENABLE_SCHEDULER=false)');
    return [];
  }

  return JOBS.map((job) => {
    const task = cron.schedule(
      job.schedule,
      () => {
        withLock(job.name, job.ttlMs, job.run).catch(() => {});
      },
      { timezone: env.TZ },
    );
    logger.info({ job: job.name, schedule: job.schedule, tz: env.TZ }, 'tâche planifiée enregistrée');
    return task;
  });
}

/** Exécution manuelle, utilisée par le backoffice et les tests. */
export const runJob = (name) => {
  const job = JOBS.find((j) => j.name === name);
  if (!job) throw new Error(`Tâche inconnue : ${name}`);
  return withLock(job.name, job.ttlMs, job.run);
};

export const jobNames = JOBS.map((j) => j.name);
