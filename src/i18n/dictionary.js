/**
 * Dictionnaire français → anglais.
 *
 * La clé est la chaîne française telle qu'elle apparaît dans le code ; la
 * valeur, sa traduction anglaise. Le français n'a pas besoin d'entrée : c'est
 * la langue source. On regroupe par zone de l'interface pour que la relecture
 * suive l'écran.
 *
 * Les gabarits gardent leurs jetons `{nom}` des deux côtés.
 */
export const DICTIONARY = {
  // --- Coque : barre de service, en-tête -----------------------------------
  'Livraison à Yaoundé et Douala — retrait gratuit en boutique':
    'Delivery in Yaoundé and Douala — free in-store pickup',
  'Vendre sur Chichard': 'Sell on Chichard',
  'Suivre ma commande': 'Track my order',
  'Aide': 'Help',
  'Liens de service': 'Service links',
  'Favoris': 'Favourites',
  'Commandes': 'Orders',
  'Panier': 'Cart',
  'Ouvrir le panier, {n} article': 'Open cart, {n} item',
  'Ouvrir le panier, {n} articles': 'Open cart, {n} items',
  'Voir la boutique': 'Back to shop',
  'Français': 'French',
  'Anglais': 'English',
  'Changer de langue': 'Change language',
  'Langue': 'Language',

  // --- Barre de rayons ------------------------------------------------------
  'Tous les rayons': 'All departments',
  'Rayons': 'Departments',
  'Expire aujourd’hui': 'Expiring today',
  'Meilleures affaires': 'Best deals',
  'Nouveautés': 'New arrivals',
  'Fruits & légumes': 'Fruit & vegetables',
  'Produits laitiers': 'Dairy',
  'Viandes & poissons': 'Meat & fish',
  'Boulangerie': 'Bakery',
  'Épicerie': 'Grocery',
  'Boissons': 'Drinks',
  'Surgelés': 'Frozen',
  'Hygiène': 'Hygiene',
  'Conserves': 'Canned goods',
  'Condiments': 'Condiments',

  // --- Bandeau réassurance --------------------------------------------------
  'Produits vérifiés': 'Verified products',
  'Date limite contrôlée par la boutique': 'Use-by date checked by the shop',
  'Retrait gratuit': 'Free pickup',
  'En boutique, sous 2 h après la commande': 'In store, within 2 h of ordering',
  'Paiement mobile': 'Mobile payment',
  'Orange Money, MTN MoMo ou à la livraison': 'Orange Money, MTN MoMo or on delivery',
  'Anti-gaspillage': 'Anti-waste',
  'Chaque achat évite un produit jeté': 'Every purchase saves a product from the bin',

  // --- Recherche ------------------------------------------------------------
  'Rechercher un produit, une marque, une boutique…':
    'Search a product, a brand, a shop…',
  'Rechercher': 'Search',
  'Effacer la recherche': 'Clear search',
  'Suggestions': 'Suggestions',
  'Aucun résultat': 'No results',
  'Produit': 'Product',
  'Rayon': 'Department',
  'Boutique': 'Shop',

  // --- Mini-panier ----------------------------------------------------------
  'Votre panier': 'Your cart',
  'Votre panier est vide': 'Your cart is empty',
  'Parcourez le catalogue pour le remplir': 'Browse the catalogue to fill it',
  'Découvrir le catalogue': 'Browse the catalogue',
  'Sous-total': 'Subtotal',
  'Vous économisez {montant}': 'You save {montant}',
  'Voir le panier': 'View cart',
  'Passer la commande': 'Checkout',
  'Retirer un article': 'Remove one item',
  'Ajouter un article': 'Add one item',
  'Supprimer {nom}': 'Remove {nom}',

  // --- Menu compte ----------------------------------------------------------
  'Se connecter': 'Sign in',
  'Créer un compte': 'Create account',
  'Mon compte': 'My account',
  'Mes commandes': 'My orders',
  'Mes favoris': 'My favourites',
  'Programme de fidélité': 'Loyalty programme',
  'Espace partenaire': 'Partner area',
  'Espace livreur': 'Courier area',
  'Backoffice': 'Backoffice',
  'Paramètres': 'Settings',
  'Se déconnecter': 'Sign out',
  'Bonjour, {prénom}': 'Hello, {prénom}',
  'Compte': 'Account',

  // --- Pied de page ---------------------------------------------------------
  'Acheter': 'Shop',
  'Tout le catalogue': 'Full catalogue',
  'Comment ça marche': 'How it works',
  'À propos': 'About',
  'Vendre': 'Sell',
  'Devenir partenaire': 'Become a partner',
  'Nous contacter': 'Contact us',
  'Suivez-nous': 'Follow us',
  'Chichard — la place de marché anti-gaspillage du Cameroun':
    'Chichard — Cameroon’s anti-waste marketplace',
  'Tous droits réservés': 'All rights reserved',
  'Conditions générales': 'Terms of service',
  'Confidentialité': 'Privacy',

  // --- Fil d’Ariane ---------------------------------------------------------
  'Accueil': 'Home',
  'Catalogue': 'Catalogue',

  // --- Carte produit --------------------------------------------------------
  'Ajouter': 'Add',
  'Ajouter au panier': 'Add to cart',
  'Épuisé': 'Sold out',
  'Dernier jour': 'Last day',
  'Demain': 'Tomorrow',
  'Périmé': 'Expired',
  'Dans {n} jours': 'In {n} days',
  'Date limite vérifiée par la boutique': 'Use-by date verified by the shop',
  'Produit vérifié': 'Verified product',

  // --- Accueil --------------------------------------------------------------
  'Sauvez des produits, économisez vraiment.':
    'Save products, save real money.',
  'Les invendus des boutiques camerounaises à petit prix, plutôt qu’à la poubelle.':
    'Unsold goods from Cameroonian shops at low prices, instead of in the bin.',
  'Voir les offres': 'See the deals',
  'Comment ça marche ?': 'How does it work?',
  'Expire bientôt': 'Expiring soon',
  'À sauver en priorité': 'Save these first',
  'Voir tout': 'See all',
  'Par rayon': 'By department',
  'Les boutiques près de chez vous': 'Shops near you',

  // --- Catalogue / facettes -------------------------------------------------
  'Filtrer': 'Filter',
  'Filtres': 'Filters',
  'Effacer les filtres': 'Clear filters',
  'Trier par': 'Sort by',
  'Pertinence': 'Relevance',
  'Prix croissant': 'Price: low to high',
  'Prix décroissant': 'Price: high to low',
  'Remise la plus forte': 'Biggest discount',
  'Expire bientôt d’abord': 'Expiring soonest',
  'Date limite': 'Use-by date',
  'Prix': 'Price',
  'Marques': 'Brands',
  'Boutiques': 'Shops',
  'Toutes les dates': 'All dates',
  'Sous 3 jours': 'Within 3 days',
  'Sous 7 jours': 'Within 7 days',
  '{n} produit disponible': '{n} product available',
  '{n} produits disponibles': '{n} products available',
  'Aucun produit ne correspond': 'No product matches',
  'Essayez d’élargir vos filtres': 'Try widening your filters',
  'Voir les {n} entrées': 'See all {n} entries',
  'Min': 'Min',
  'Max': 'Max',
  'Précédent': 'Previous',
  'Suivant': 'Next',

  // --- Fiche produit --------------------------------------------------------
  'Économisez {montant}': 'Save {montant}',
  'Quantité': 'Quantity',
  'Il reste {n} en stock': '{n} left in stock',
  'Description': 'Description',
  'Avis clients': 'Customer reviews',
  'Retrait en boutique': 'In-store pickup',
  'Livraison à domicile': 'Home delivery',
  'Produits similaires': 'Similar products',
  'Ajouté au panier': 'Added to cart',

  // --- Panier ---------------------------------------------------------------
  'Mon panier': 'My cart',
  'Continuer mes achats': 'Continue shopping',
  'Vider le panier': 'Empty cart',
  'Total': 'Total',
  'Frais de livraison': 'Delivery fee',
  'Calculés à l’étape suivante': 'Calculated at the next step',
  'Code promo': 'Promo code',
  'Appliquer': 'Apply',

  // --- Tunnel de commande ---------------------------------------------------
  'Livraison': 'Delivery',
  'Paiement': 'Payment',
  'Récapitulatif': 'Summary',
  'Coordonnées': 'Contact details',
  'Nom complet': 'Full name',
  'Téléphone': 'Phone',
  'Adresse e-mail': 'Email address',
  'Adresse de livraison': 'Delivery address',
  'Ville': 'City',
  'Mode de retrait': 'Fulfilment method',
  'Retrait gratuit en boutique': 'Free in-store pickup',
  'Mode de paiement': 'Payment method',
  'Payer à la livraison': 'Pay on delivery',
  'Payer maintenant': 'Pay now',
  'Confirmer la commande': 'Place order',
  'Numéro de mobile invalide pour un paiement mobile (exemple : 6 99 11 22 33)':
    'Invalid mobile number for a mobile payment (example: 6 99 11 22 33)',

  // --- Confirmation ---------------------------------------------------------
  'Merci pour votre commande !': 'Thank you for your order!',
  'Votre commande est confirmée': 'Your order is confirmed',
  'Numéro de commande': 'Order number',
  'Code de retrait': 'Pickup code',
  'Présentez ce code en boutique': 'Show this code in store',
  'Suivre la commande': 'Track order',
  'Retour à l’accueil': 'Back home',

  // --- Connexion / inscription ---------------------------------------------
  'Connexion': 'Sign in',
  'Retrouvez vos commandes et vos points de fidélité.':
    'Find your orders and your loyalty points.',
  'Mot de passe': 'Password',
  'Oublié ?': 'Forgot?',
  'Pas encore de compte ?': 'No account yet?',
  'Déjà un compte ?': 'Already have an account?',
  'Inscription': 'Sign up',
  'vous@exemple.cm': 'you@example.cm',
  'Jusqu’à −70 % sur les produits proches de leur date limite':
    'Up to −70% on products close to their use-by date',
  'Retrait gratuit en boutique ou livraison à Yaoundé et Douala':
    'Free in-store pickup or delivery in Yaoundé and Douala',
  'Paiement Orange Money, MTN MoMo ou à la livraison':
    'Payment by Orange Money, MTN MoMo or on delivery',

  // --- Divers / états -------------------------------------------------------
  'Chargement…': 'Loading…',
  'Réessayer': 'Try again',
  'Une erreur est survenue': 'Something went wrong',
  'Annuler': 'Cancel',
  'Enregistrer': 'Save',
  'Fermer': 'Close',
  'Retour': 'Back',
  // --- Barre de recherche (chaînes exactes) --------------------------------
  'Recherche…': 'Searching…',
  'Aucune suggestion pour « {terme} »': 'No suggestion for “{terme}”',
  'Voir tous les résultats pour « {terme} »': 'See all results for “{terme}”',
  // --- Mini-panier & menu compte (chaînes exactes) -------------------------
  '{n} article': '{n} item',
  '{n} articles': '{n} items',
  'Chaque article sauvé, c\'est un repas qui ne part pas à la poubelle.':
    'Every item saved is a meal that stays out of the bin.',
  'Parcourir le catalogue': 'Browse the catalogue',
  'Retirer un {nom}': 'Remove one {nom}',
  'Ajouter un {nom}': 'Add one {nom}',
  'Supprimer {nom} du panier': 'Remove {nom} from the cart',
  'Vous économisez {montant} par rapport au prix d\'origine.':
    'You save {montant} on the original price.',
  'Livraison et remises calculées à l\'étape suivante.':
    'Delivery and discounts calculated at the next step.',
  'Commander': 'Checkout',
  'Mes points fidélité': 'My loyalty points',
  'Bonjour': 'Hello',
  'Espaces professionnels': 'Business areas',
  // --- Raccourcis & pied de page (chaînes exactes du code) -----------------
  "Expire aujourd'hui": 'Expiring today',
  'Meilleures remises': 'Best discounts',
  'Click & Collect': 'Click & Collect',
  'Suivi de commande': 'Order tracking',
  'Nos engagements': 'Our commitments',
  'Offres des marques': 'Brand offers',
  'Suivi de livraison': 'Delivery tracking',
  'Programme fidélité': 'Loyalty programme',
  'Notifications': 'Notifications',
  'Professionnels': 'For businesses',
  'La communauté': 'Community',
  'Sécurité du compte': 'Account security',
  'La plateforme camerounaise qui vend à prix réduit les produits proches de leur date limite, au lieu de les jeter.':
    'The Cameroonian platform that sells products close to their use-by date at a discount, instead of throwing them away.',
  'Yaoundé & Douala, Cameroun': 'Yaoundé & Douala, Cameroon',
  'Chichard sur Facebook': 'Chichard on Facebook',
  'Chichard sur Instagram': 'Chichard on Instagram',
  'Nos rayons': 'Our departments',
  'Carte bancaire': 'Bank card',
  'À la livraison': 'On delivery',
  'Fil d’Ariane': 'Breadcrumb',
};
