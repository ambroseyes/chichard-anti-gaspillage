/**
 * Point d'entrée unique de l'accès aux données.
 *
 *   import { api } from '@/api';
 *   const produits = await api.entities.Product.filter({ status: 'active' });
 */
import { entities } from './entities';
import { auth } from './auth';
import { subscribeToEntity } from './realtime';
import * as services from './services';

export const api = {
  entities,
  auth,
  subscribe: subscribeToEntity,
  ...services,
};

export { ApiError } from './http';
export { entities, auth };
export * from './services';
