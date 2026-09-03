import { EventEmitter } from 'node:events';

/**
 * Bus d'événements en mémoire alimentant le flux SSE.
 * Une montée en charge multi-instance remplacerait cette implémentation par
 * Redis pub/sub sans changer la surface (`publish` / `subscribe`).
 */
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export function publish(entity, event) {
  emitter.emit('event', { entity, ...event, at: new Date().toISOString() });
}

export function subscribe(listener) {
  emitter.on('event', listener);
  return () => emitter.off('event', listener);
}
