/**
 * Politiques d'accès aux entités.
 *
 * C'est le contrôle d'autorisation de référence : l'API générique
 * (`/api/entities/:entity`) refuse toute opération non décrite ici, et applique
 * en lecture un filtre calculé à partir de la session. Aucune règle
 * d'autorisation ne doit vivre côté navigateur.
 *
 * Niveaux :
 *   public     — accessible sans compte
 *   auth       — tout utilisateur connecté
 *   owner      — l'utilisateur ne voit/modifie que ses propres lignes
 *   store      — réservé au magasin propriétaire de la ligne (et à ses employés)
 *   partner    — tout partenaire connecté
 *   driver     — tout livreur connecté
 *   backoffice — opérateur / admin / super_admin
 *   admin      — administrateur applicatif
 *   never      — interdit via l'API générique ; passe par un service métier
 */

export const ACCESS = Object.freeze({
  PUBLIC: 'public',
  AUTH: 'auth',
  OWNER: 'owner',
  STORE: 'store',
  PARTNER: 'partner',
  DRIVER: 'driver',
  BACKOFFICE: 'backoffice',
  ADMIN: 'admin',
  NEVER: 'never',
});

const { PUBLIC, AUTH, OWNER, STORE, PARTNER, DRIVER, BACKOFFICE, ADMIN, NEVER } = ACCESS;

/** Contenu appartenant à l'utilisateur, entièrement géré par lui. */
const ownedByUser = (owner = 'user_email') => ({
  owner,
  read: OWNER,
  create: OWNER,
  update: OWNER,
  delete: OWNER,
});

/** Catalogue public, écrit par le magasin. */
const storeOwned = (opts = {}) => ({
  store: 'store_id',
  read: PUBLIC,
  create: STORE,
  update: STORE,
  delete: STORE,
  ...opts,
});

/** Contenu communautaire : lecture ouverte, écriture par l'auteur. */
const communityContent = (owner) => ({
  owner,
  read: PUBLIC,
  create: AUTH,
  update: OWNER,
  delete: OWNER,
});

export const policies = {
  // --- Catalogue ------------------------------------------------------------
  Product: {
    ...storeOwned(),
    // Les compteurs et le stock sont pilotés par le serveur.
    protected: ['quantity_sold', 'views_count', 'favorites_count', 'avg_rating', 'reviews_count'],
  },
  ProductVariant: storeOwned({ store: null, read: PUBLIC, create: PARTNER, update: PARTNER, delete: PARTNER }),
  ProductBatch: storeOwned({ read: STORE }),
  StockMovement: { store: 'store_id', read: STORE, create: NEVER, update: NEVER, delete: NEVER },
  Store: {
    store: 'id',
    read: PUBLIC,
    // La création passe par POST /api/partner/stores : c'est là que le magasin
    // est rattaché à son propriétaire et que la vérification est déclenchée.
    create: NEVER,
    update: STORE,
    delete: ADMIN,
    // Statut de partenariat et compteurs : décidés par le backoffice ou le serveur.
    protected: [
      'status', 'is_partner', 'rating', 'total_products_saved',
      'total_revenue_recovered', 'total_savings_generated',
      'email_verified', 'verification_token',
    ],
  },
  PriceComparison: { read: PUBLIC, create: NEVER, update: NEVER, delete: NEVER },

  // --- Commande et paiement -------------------------------------------------
  // La création d'une commande passe obligatoirement par POST /api/orders :
  // c'est là que prix, coupon, stock et paiement sont vérifiés.
  Order: {
    owner: 'customer_email',
    store: 'store_id',
    read: OWNER,
    readAlso: [STORE, DRIVER, BACKOFFICE],
    create: NEVER,
    update: NEVER,
    delete: NEVER,
  },
  CartItem: ownedByUser(),
  Coupon: { owner: 'user_email', read: OWNER, create: NEVER, update: NEVER, delete: NEVER },
  DigitalReceipt: { owner: 'user_email', read: OWNER, create: AUTH, update: NEVER, delete: NEVER },
  CommissionTransaction: { read: BACKOFFICE, create: NEVER, update: NEVER, delete: NEVER },

  // --- Click & Collect ------------------------------------------------------
  ClickCollectBasket: {
    ...storeOwned(),
    protected: ['quantity_reserved'],
  },
  ClickCollectReservation: {
    owner: 'customer_email',
    store: 'store_id',
    read: OWNER,
    readAlso: [STORE, BACKOFFICE],
    create: NEVER,
    update: NEVER,
    delete: NEVER,
  },
  BasketReview: {
    owner: 'customer_email',
    read: PUBLIC,
    create: OWNER,
    update: OWNER,
    delete: OWNER,
  },
  PickupRequest: {
    owner: 'customer_email',
    store: 'store_id',
    read: OWNER,
    readAlso: [STORE],
    create: OWNER,
    update: STORE,
    delete: NEVER,
    protected: ['confirmation_code', 'status'],
  },

  // --- Livraison ------------------------------------------------------------
  DeliveryRoute: { owner: 'driver_email', read: OWNER, readAlso: [BACKOFFICE], create: DRIVER, update: OWNER, delete: OWNER },
  DeliveryAddress: ownedByUser(),

  // --- Utilisateurs et fidélité --------------------------------------------
  User: {
    owner: 'email',
    read: OWNER,
    readAlso: [BACKOFFICE],
    create: NEVER,
    update: NEVER,
    delete: NEVER,
  },
  UserPreference: ownedByUser(),
  UserInteraction: { owner: 'user_email', read: OWNER, create: OWNER, update: NEVER, delete: NEVER },
  CustomerSegment: { owner: 'user_email', read: OWNER, readAlso: [BACKOFFICE], create: NEVER, update: NEVER, delete: NEVER },
  DashboardPreference: ownedByUser(),
  SavedSearch: ownedByUser(),
  Favorite: ownedByUser(),
  ShoppingList: ownedByUser(),
  IdentityVerification: {
    owner: 'user_email',
    read: OWNER,
    readAlso: [BACKOFFICE],
    create: OWNER,
    update: NEVER,
    delete: NEVER,
    protected: ['status', 'verified_at', 'verification_level', 'reviewer_notes'],
  },
  LoyaltyTransaction: { owner: 'user_email', read: OWNER, create: NEVER, update: NEVER, delete: NEVER },
  LoyaltyReward: { read: PUBLIC, create: ADMIN, update: ADMIN, delete: ADMIN },
  Experience: { ...storeOwned(), protected: ['current_participants'] },
  ExperienceBooking: {
    owner: 'user_email',
    read: OWNER,
    readAlso: [STORE],
    create: NEVER,
    update: NEVER,
    delete: NEVER,
  },

  // --- Défis ----------------------------------------------------------------
  Challenge: { read: PUBLIC, create: ADMIN, update: ADMIN, delete: ADMIN, protected: ['participants_count'] },
  UserChallenge: { owner: 'user_email', read: OWNER, create: OWNER, update: NEVER, delete: NEVER },
  PartnerChallenge: {
    ...storeOwned(),
    protected: ['participants_count', 'completions_count', 'total_revenue_generated'],
  },

  // --- Communauté -----------------------------------------------------------
  SocialPost: { ...communityContent('author_email'), protected: ['likes_count', 'comments_count', 'shares_count', 'liked_by', 'is_featured'] },
  Comment: { ...communityContent('author_email'), protected: ['likes_count'] },
  Recipe: { ...communityContent('author_email'), protected: ['likes_count', 'saves_count', 'status'] },
  RecipeRating: { ...communityContent('user_email'), protected: ['helpful_count'] },
  Review: { ...communityContent('user_email'), protected: ['helpful_count', 'is_verified_purchase'] },
  ZeroWasteTip: { ...communityContent('author_email'), protected: ['likes_count', 'saves_count', 'liked_by', 'status'] },
  ChatRoom: { read: AUTH, create: ADMIN, update: ADMIN, delete: ADMIN, protected: ['members_count', 'last_message', 'last_message_date'] },
  ChatMessage: { owner: 'sender_email', read: AUTH, create: AUTH, update: OWNER, delete: OWNER, protected: ['reactions', 'is_pinned'] },
  Message: {
    owner: 'sender_email',
    read: NEVER, // messagerie privée : passe par /api/messages, qui filtre sur les deux côtés
    create: AUTH,
    update: NEVER,
    delete: NEVER,
  },
  Notification: {
    owner: 'user_email',
    read: OWNER,
    create: NEVER,
    update: OWNER, // uniquement pour marquer comme lue
    delete: OWNER,
    writable: ['is_read'],
  },
  ScamReport: {
    owner: 'reporter_email',
    read: BACKOFFICE,
    create: AUTH,
    update: BACKOFFICE,
    delete: NEVER,
    protected: ['status'],
  },

  // --- Promotions et marques ------------------------------------------------
  Promotion: { ...storeOwned(), protected: ['usage_count'] },
  PromotionRule: { ...storeOwned(), read: STORE, protected: ['execution_count', 'last_executed'] },
  BrandPartnership: { read: BACKOFFICE, create: ADMIN, update: ADMIN, delete: ADMIN, protected: ['total_spent', 'total_sales_generated', 'total_commissions_paid'] },
  SponsoredCampaign: { read: BACKOFFICE, create: ADMIN, update: ADMIN, delete: ADMIN, protected: ['spent', 'impressions', 'clicks', 'conversions', 'revenue_generated', 'roi', 'ctr', 'conversion_rate'] },
  CampaignMetrics: { read: BACKOFFICE, create: NEVER, update: NEVER, delete: NEVER },
  PartnerStatusHistory: { read: BACKOFFICE, readAlso: [STORE], create: NEVER, update: NEVER, delete: NEVER },
};

export const knownEntities = Object.freeze(Object.keys(policies));

export function policyFor(entity) {
  return Object.prototype.hasOwnProperty.call(policies, entity) ? policies[entity] : null;
}
