/**
 * Contenu des guides.
 *
 * Chaque texte porte ses deux langues (`fr`/`en`) pour rester lisible d'un
 * bloc, sans gonfler le dictionnaire général. Les étapes visent un élément réel
 * par son attribut `data-tour` ; si la cible n'est pas dans la page, l'étape est
 * simplement sautée — un guide ne doit jamais pointer dans le vide.
 */

/** Le type d'utilisateur, dans l'ordre de priorité des accès. */
export function roleOf(user) {
  if (!user) return 'client';
  if (user.backoffice_role && user.backoffice_role !== 'none') return 'backoffice';
  if (user.is_delivery_driver) return 'driver';
  if (user.is_partner) return 'partner';
  return 'client';
}

/** Message de bienvenue à la première connexion, propre à chaque rôle. */
export const WELCOME = {
  client: {
    title: { fr: 'Bienvenue sur Chichard !', en: 'Welcome to Chichard!' },
    body: {
      fr: 'Ici, vous sauvez des produits proches de leur date limite à prix réduit. Laissez-vous guider : on vous montre où chercher, comment commander et où suivre vos achats.',
      en: 'Here you save products close to their use-by date at a discount. Let us guide you: where to search, how to order, and where to track your purchases.',
    },
    landing: 'Home',
  },
  partner: {
    title: { fr: 'Bienvenue, partenaire !', en: 'Welcome, partner!' },
    body: {
      fr: 'Votre espace partenaire vous permet de mettre vos invendus en vente, de fixer vos remises et de suivre ce que vous récupérez. On vous fait le tour du tableau de bord.',
      en: 'Your partner area lets you list unsold goods, set discounts and track what you recover. Let us walk you through the dashboard.',
    },
    landing: 'PartnerDashboard',
  },
  driver: {
    title: { fr: 'Bienvenue, livreur !', en: 'Welcome, courier!' },
    body: {
      fr: 'Votre espace regroupe vos tournées, les commandes à récupérer et à livrer, et le scan des codes de retrait. On vous montre l’essentiel.',
      en: 'Your area gathers your routes, the orders to pick up and deliver, and pickup-code scanning. Here are the essentials.',
    },
    landing: 'DriverDashboard',
  },
  backoffice: {
    title: { fr: 'Bienvenue dans le backoffice', en: 'Welcome to the backoffice' },
    body: {
      fr: 'Vous pilotez la plateforme : indicateurs, utilisateurs, transactions, validation des partenaires et suivi commercial. On vous présente le tableau de bord.',
      en: 'You run the platform: metrics, users, transactions, partner validation and sales tracking. Here is the dashboard.',
    },
    landing: 'AdminBackoffice',
  },
};

const t2 = (fr, en) => ({ fr, en });

/** Tours par page. La clé est le nom de page (table des routes). */
export const PAGE_TOURS = {
  Home: [
    {
      target: '[data-tour="search"]',
      title: t2('Cherchez un produit', 'Search for a product'),
      body: t2(
        'Tapez un produit, une marque ou une boutique. Les suggestions apparaissent au fil de la frappe.',
        'Type a product, a brand or a shop. Suggestions appear as you type.',
      ),
    },
    {
      target: '[data-tour="departments"]',
      title: t2('Parcourez par rayon', 'Browse by department'),
      body: t2(
        'Ouvrez tous les rayons, ou allez droit à « Expire aujourd’hui » pour les meilleures affaires du jour.',
        'Open all departments, or jump to “Expiring today” for the best deals of the day.',
      ),
    },
    {
      target: '[data-tour="see-catalog"]',
      title: t2('Tout le catalogue', 'The whole catalogue'),
      body: t2(
        'Ce bouton ouvre le catalogue complet, avec les filtres pour affiner par prix, date limite et boutique.',
        'This button opens the full catalogue, with filters to refine by price, use-by date and shop.',
      ),
    },
    {
      target: '[data-tour="cart"]',
      title: t2('Votre panier', 'Your cart'),
      body: t2(
        'Vos articles s’ajoutent ici. Cliquez pour l’ouvrir et passer commande quand vous êtes prêt.',
        'Your items land here. Click to open it and check out when you’re ready.',
      ),
    },
    {
      target: '[data-tour="account"]',
      title: t2('Votre compte', 'Your account'),
      body: t2(
        'Vos commandes, vos favoris et vos points de fidélité sont réunis dans ce menu.',
        'Your orders, favourites and loyalty points are all in this menu.',
      ),
    },
    {
      target: '[data-tour="lang"]',
      title: t2('Français ou anglais', 'French or English'),
      body: t2(
        'Basculez la langue de toute l’interface à tout moment, d’un simple clic.',
        'Switch the whole interface language at any time, in one click.',
      ),
    },
  ],
  Catalog: [
    {
      target: '[data-tour="facets"]',
      title: t2('Affinez avec les filtres', 'Refine with filters'),
      body: t2(
        'Rayon, date limite, prix, marque, boutique : chaque case indique combien de produits elle ajoute.',
        'Department, use-by date, price, brand, shop: each box shows how many products it adds.',
      ),
    },
    {
      target: '[data-tour="sort"]',
      title: t2('Triez les résultats', 'Sort the results'),
      body: t2(
        'Par pertinence, par prix, ou par remise la plus forte pour repérer les meilleures affaires.',
        'By relevance, by price, or by biggest discount to spot the best deals.',
      ),
    },
    {
      target: '[data-tour="add"]',
      title: t2('Ajoutez au panier', 'Add to cart'),
      body: t2(
        'Un clic sur « Ajouter » place le produit dans votre panier, sans quitter la page.',
        'One click on “Add” drops the product into your cart, without leaving the page.',
      ),
    },
  ],
  Cart: [
    {
      target: '[data-tour="coupon"]',
      title: t2('Un code promo ?', 'A promo code?'),
      body: t2(
        'Saisissez-le ici : la remise est vérifiée par nos serveurs et appliquée au total.',
        'Enter it here: the discount is checked by our servers and applied to the total.',
      ),
    },
    {
      target: '[data-tour="checkout"]',
      title: t2('Passez commande', 'Check out'),
      body: t2(
        'Ce bouton ouvre le tunnel de commande : récupération, paiement, confirmation.',
        'This button opens checkout: fulfilment, payment, confirmation.',
      ),
    },
  ],
  Checkout: [
    {
      target: '[data-tour="steps"]',
      title: t2('Trois étapes', 'Three steps'),
      body: t2(
        'Livraison, paiement, puis vérification. Vous pouvez revenir en arrière à tout moment.',
        'Delivery, payment, then review. You can go back at any time.',
      ),
    },
    {
      target: '[data-tour="summary"]',
      title: t2('Le récapitulatif', 'The summary'),
      body: t2(
        'Le total affiché est celui calculé par nos serveurs — jamais une addition faite dans le navigateur.',
        'The total shown is the one computed by our servers — never an in-browser calculation.',
      ),
    },
  ],
  PartnerDashboard: [
    {
      target: '[data-tour="partner-add"]',
      title: t2('Ajoutez un produit', 'Add a product'),
      body: t2(
        'Mettez un invendu en vente en quelques secondes : nom, prix d’origine, remise, date limite.',
        'List an unsold item in seconds: name, original price, discount, use-by date.',
      ),
    },
    {
      target: '[data-tour="partner-nav"]',
      title: t2('Votre espace', 'Your area'),
      body: t2(
        'Produits, paniers du soir, défis, statistiques : tout votre outil de travail est dans ce menu.',
        'Products, evening baskets, challenges, statistics: your whole toolkit is in this menu.',
      ),
    },
  ],
  PartnerProducts: [
    {
      target: '[data-tour="partner-add"]',
      title: t2('Nouveau produit', 'New product'),
      body: t2(
        'Chaque produit porte son stock et sa date limite : le prix baisse à l’approche de la péremption.',
        'Each product carries its stock and use-by date: the price drops as expiry nears.',
      ),
    },
  ],
  DriverDashboard: [
    {
      target: '[data-tour="driver-stats"]',
      title: t2('Votre tournée en un coup d’œil', 'Your route at a glance'),
      body: t2(
        'À récupérer, en route, livrées : le compte du jour est toujours en tête d’écran.',
        'To pick up, en route, delivered: the day’s count is always at the top.',
      ),
    },
    {
      target: '[data-tour="driver-scan"]',
      title: t2('Scannez les codes', 'Scan the codes'),
      body: t2(
        'À la remise, le client vous dicte ou vous montre son code : scannez-le pour confirmer la livraison.',
        'On handover, the customer reads out or shows their code: scan it to confirm delivery.',
      ),
    },
  ],
  AdminBackoffice: [
    {
      target: '[data-tour="bo-nav"]',
      title: t2('La navigation', 'Navigation'),
      body: t2(
        'Pilotage, utilisateurs, transactions, validation des partenaires, suivi commercial, journaux.',
        'Overview, users, transactions, partner validation, sales tracking, logs.',
      ),
    },
    {
      target: '[data-tour="bo-kpis"]',
      title: t2('Les indicateurs', 'The metrics'),
      body: t2(
        'Revenus, commandes, panier moyen : calculés en base sur la période choisie, jamais estimés.',
        'Revenue, orders, average basket: computed in the database over the chosen period, never estimated.',
      ),
    },
    {
      target: '[data-tour="bo-period"]',
      title: t2('La période', 'The period'),
      body: t2(
        'Changez la fenêtre d’analyse ; tous les indicateurs et graphiques suivent.',
        'Change the analysis window; all metrics and charts follow.',
      ),
    },
  ],
};
