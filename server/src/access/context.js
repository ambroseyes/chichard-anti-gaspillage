import { prisma } from '../lib/prisma.js';

/**
 * Magasins que l'utilisateur pilote : celui rattaché à son compte, ceux dont il
 * est propriétaire, ceux où il est déclaré employé. Résolu une fois par requête.
 */
export async function storeIdsFor(user) {
  if (!user) return [];
  const stores = await prisma.store.findMany({
    where: {
      OR: [
        user.store_id ? { id: user.store_id } : undefined,
        { owner_email: user.email },
        { employee_emails: { has: user.email } },
      ].filter(Boolean),
    },
    select: { id: true },
  });
  return stores.map((s) => s.id);
}

/** Ajoute `req.storeIds` (mémoïsé) pour les vérifications d'accès magasin. */
export async function withStoreContext(req) {
  if (req.storeIds) return req.storeIds;
  req.storeIds = await storeIdsFor(req.user);
  return req.storeIds;
}

/** Rôle backoffice effectif : `admin` applicatif vaut `admin` backoffice. */
export function backofficeRoleOf(user) {
  if (!user) return 'none';
  if (user.backoffice_role && user.backoffice_role !== 'none') return user.backoffice_role;
  return user.role === 'admin' ? 'admin' : 'none';
}
