import { Router } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { subscribe } from '../realtime/bus.js';
import { readScope, DENY } from '../access/enforce.js';

export const realtimeRouter = Router();

/**
 * Flux d'événements (SSE). Un client ne reçoit un événement que s'il a le droit
 * de lire l'entité concernée : le filtre d'accès est réévalué à chaque message.
 */
realtimeRouter.get('/events', requireAuth, async (req, res) => {
  const entities = String(req.query.entities ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': flux ouvert\n\n');

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);

  const unsubscribe = subscribe(async (event) => {
    if (entities.length && !entities.includes(event.entity)) return;
    const scope = await readScope(event.entity, req.user, req);
    if (scope === DENY) return;
    res.write(`event: ${event.entity}\ndata: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});
