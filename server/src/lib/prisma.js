import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const globalForPrisma = globalThis;

/*
 * `DEBUG_SQL=1` fait émettre un événement par requête SQL. De quoi mesurer ce
 * que coûte réellement un point d'entrée : un écran qui déclenche trente
 * requêtes ne se voit pas autrement qu'en les comptant.
 */
const traceSql = process.env.DEBUG_SQL === '1';

export const prisma =
  globalForPrisma.__chichardPrisma ??
  new PrismaClient({
    log: traceSql
      ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
      : env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.__chichardPrisma = prisma;

/*
 * Un seul écouteur pour toute la vie du processus : `$on` ne sait pas retirer
 * ce qu'il a posé, en enregistrer un par mesure les accumulerait.
 */
let requêtesÉmises = 0;
if (traceSql) prisma.$on('query', () => { requêtesÉmises += 1; });

/**
 * Compte les requêtes SQL émises pendant l'exécution de `action`.
 *
 * Renvoie `null` quand la trace est éteinte, plutôt qu'un zéro trompeur. Le
 * compteur est global : deux mesures menées en parallèle se contamineraient.
 */
export async function countQueries(action) {
  if (!traceSql) {
    await action();
    return null;
  }

  const avant = requêtesÉmises;
  await action();
  // Prisma publie l'événement après coup : sans ce répit, les dernières
  // requêtes de `action` manqueraient à l'appel.
  await new Promise((resolve) => setTimeout(resolve, 50));
  return requêtesÉmises - avant;
}
