import { request } from './http';

/** Commandes : devis, création, annulation, validation de remise. */
export const orders = {
  quote: (payload) => request('/api/orders/quote', { method: 'POST', body: payload }).then((r) => r.data),
  create: (payload) => request('/api/orders', { method: 'POST', body: payload }).then((r) => r.data),
  cancel: (id, reason) =>
    request(`/api/orders/${id}/cancel`, { method: 'POST', body: { reason } }).then((r) => r.data),
  /** Validation du retrait ou de la livraison, par le magasin ou le livreur. */
  fulfil: (id, { token, code }) =>
    request(`/api/orders/${id}/fulfil`, { method: 'POST', body: { token, code } }).then((r) => r.data),
};

export const reservations = {
  create: (payload) => request('/api/reservations', { method: 'POST', body: payload }).then((r) => r.data),
  collect: (id, code) =>
    request(`/api/reservations/${id}/collect`, { method: 'POST', body: { code } }).then((r) => r.data),
};

export const loyalty = {
  summary: () => request('/api/loyalty/summary').then((r) => r.data),
  redeem: (rewardId) =>
    request('/api/loyalty/redeem', { method: 'POST', body: { reward_id: rewardId } }).then((r) => r.data),
  bookExperience: (id) =>
    request(`/api/loyalty/experiences/${id}/book`, { method: 'POST' }).then((r) => r.data),
};

export const partner = {
  dashboard: (days = 30) => request(`/api/partner/dashboard?days=${days}`).then((r) => r.data),
  applySuggestedPrices: (productIds) =>
    request('/api/partner/products/apply-suggested-prices', {
      method: 'POST',
      body: { product_ids: productIds },
    }).then((r) => r.data),
  createStore: (payload) => request('/api/partner/stores', { method: 'POST', body: payload }).then((r) => r.data),
  verifyStore: (storeId, token) =>
    request('/api/partner/stores/verify', { method: 'POST', body: { store_id: storeId, token } }).then(
      (r) => r.data,
    ),
  setBookingStatus: (bookingId, status) =>
    request(`/api/partner/bookings/${bookingId}/status`, { method: 'PATCH', body: { status } }).then(
      (r) => r.data,
    ),
  adjustStock: (productId, payload) =>
    request(`/api/partner/products/${productId}/adjust-stock`, { method: 'POST', body: payload }).then(
      (r) => r.data,
    ),
};

export const backoffice = {
  overview: (days = 30) => request(`/api/backoffice/overview?days=${days}`).then((r) => r.data),
  users: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    );
    return request(`/api/backoffice/users?${query}`);
  },
  setUserRole: (id, role) =>
    request(`/api/backoffice/users/${id}/role`, { method: 'PATCH', body: { backoffice_role: role } }).then(
      (r) => r.data,
    ),
  setUserStatus: (id, isActive) =>
    request(`/api/backoffice/users/${id}/status`, { method: 'PATCH', body: { is_active: isActive } }).then(
      (r) => r.data,
    ),
  auditLogs: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    );
    return request(`/api/backoffice/audit-logs?${query}`);
  },
  transactions: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    );
    return request(`/api/backoffice/transactions?${query}`);
  },
  setStoreStatus: (id, status, notes) =>
    request(`/api/backoffice/stores/${id}/status`, { method: 'PATCH', body: { status, notes } }).then(
      (r) => r.data,
    ),
};

export const payments = {
  status: (reference) => request(`/api/payments/${reference}`).then((r) => r.data),
  settleCash: (reference) =>
    request(`/api/payments/${reference}/settle-cash`, { method: 'POST' }).then((r) => r.data),
};

/**
 * Assistance IA. Le navigateur choisit une tâche nommée et fournit des
 * paramètres : il ne compose jamais de prompt, et ne détient aucune clé d'API.
 */
const aiTask = (task) => (payload = {}) =>
  request(`/api/ai/${task}`, { method: 'POST', body: payload }).then((r) => r.data);

export const ai = {
  recipeFromIngredients: (ingredients, servings) => aiTask('recipe_from_ingredients')({ ingredients, servings }),
  recipeAnalysis: (recipe) => aiTask('recipe_analysis')({ recipe }),
  ingredientAlternatives: (ingredient) => aiTask('ingredient_alternatives')({ ingredient }),
  mealPlan: aiTask('meal_plan'),
  cartSuggestions: aiTask('cart_suggestions'),
  partnerAssistant: (question) => aiTask('partner_assistant')({ question }),
  partnerRestockAdvice: aiTask('partner_restock_advice'),
  routeOptimization: (orderIds) => aiTask('route_optimization')({ order_ids: orderIds }),
  productRecommendations: (limit) => aiTask('product_recommendations')({ limit }),
};

/** Téléversement direct : le fichier part en flux, le serveur renvoie son URL. */
export const uploads = {
  async file(file) {
    const { data } = await request('/api/uploads', {
      method: 'POST',
      body: file,
      headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
    });
    return data;
  },
};

export const config = {
  get: () => request('/api/config').then((r) => r.data),
};
