import { prisma } from './prisma.js';
import { logger } from './logger.js';
import { backofficeRoleOf } from '../access/context.js';

/**
 * Écrit une ligne de journal d'audit. Les échecs d'écriture sont journalisés
 * mais n'interrompent jamais la requête métier en cours.
 */
export async function recordAudit(
  req,
  { action, module, entity_id, description, success = true, metadata, actor_email },
) {
  try {
    await prisma.auditLog.create({
      data: {
        actor_email: actor_email ?? req?.user?.email ?? null,
        actor_role: req?.user ? backofficeRoleOf(req.user) : null,
        action,
        module,
        entity_name: module,
        entity_id: entity_id ?? null,
        description: description ?? null,
        ip: req?.ip ?? null,
        user_agent: req?.headers?.['user-agent']?.slice(0, 255) ?? null,
        success,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    logger.warn({ err: error }, "écriture du journal d'audit impossible");
  }
}
