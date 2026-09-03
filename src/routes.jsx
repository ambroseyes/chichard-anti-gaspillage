import { lazy } from 'react';

/**
 * Table des routes.
 *
 * Chaque page est chargée à la demande : le visiteur de l'accueil ne télécharge
 * ni le backoffice, ni les cartes, ni le scanner. `role` désigne le niveau
 * exigé — l'autorisation réelle reste appliquée par le serveur.
 */
const page = (loader) => lazy(loader);

export const routes = [
  // --- Public ---------------------------------------------------------------
  { path: '/', name: 'Home', element: page(() => import('./pages/Home')), index: true },
  { path: '/Catalog', name: 'Catalog', element: page(() => import('./pages/Catalog')) },
  { path: '/ProductDetail', name: 'ProductDetail', element: page(() => import('./pages/ProductDetail')) },
  { path: '/ClickCollect', name: 'ClickCollect', element: page(() => import('./pages/ClickCollect')) },
  { path: '/About', name: 'About', element: page(() => import('./pages/About')) },
  { path: '/Contact', name: 'Contact', element: page(() => import('./pages/Contact')) },
  { path: '/BecomePartner', name: 'BecomePartner', element: page(() => import('./pages/BecomePartner')) },
  { path: '/VerifyPartner', name: 'VerifyPartner', element: page(() => import('./pages/VerifyPartner')) },
  { path: '/Community', name: 'Community', element: page(() => import('./pages/Community')) },
  { path: '/BrandOffers', name: 'BrandOffers', element: page(() => import('./pages/BrandOffers')) },
  { path: '/ChichardPlus', name: 'ChichardPlus', element: page(() => import('./pages/ChichardPlus')) },

  // --- Compte requis --------------------------------------------------------
  { path: '/Cart', name: 'Cart', role: 'authenticated', element: page(() => import('./pages/Cart')) },
  { path: '/Checkout', name: 'Checkout', role: 'authenticated', element: page(() => import('./pages/Checkout')) },
  { path: '/OrderConfirmation', name: 'OrderConfirmation', role: 'authenticated', element: page(() => import('./pages/OrderConfirmation')) },
  { path: '/Orders', name: 'Orders', role: 'authenticated', element: page(() => import('./pages/Orders')) },
  { path: '/MyAccount', name: 'MyAccount', role: 'authenticated', element: page(() => import('./pages/MyAccount')) },
  { path: '/Profile', name: 'Profile', role: 'authenticated', element: page(() => import('./pages/Profile')) },
  { path: '/Settings', name: 'Settings', role: 'authenticated', element: page(() => import('./pages/Settings')) },
  { path: '/Notifications', name: 'Notifications', role: 'authenticated', element: page(() => import('./pages/Notifications')) },
  { path: '/NotificationSettings', name: 'NotificationSettings', role: 'authenticated', element: page(() => import('./pages/NotificationSettings')) },
  { path: '/ProductPreferences', name: 'ProductPreferences', role: 'authenticated', element: page(() => import('./pages/ProductPreferences')) },
  { path: '/Achievements', name: 'Achievements', role: 'authenticated', element: page(() => import('./pages/Achievements')) },
  { path: '/LoyaltyProgram', name: 'LoyaltyProgram', role: 'authenticated', element: page(() => import('./pages/LoyaltyProgram')) },
  { path: '/WeeklyChallenges', name: 'WeeklyChallenges', role: 'authenticated', element: page(() => import('./pages/WeeklyChallenges')) },
  { path: '/CommunityChat', name: 'CommunityChat', role: 'authenticated', element: page(() => import('./pages/CommunityChat')) },
  { path: '/FoodCoach', name: 'FoodCoach', role: 'authenticated', element: page(() => import('./pages/FoodCoach')) },
  { path: '/AIRecipes', name: 'AIRecipes', role: 'authenticated', element: page(() => import('./pages/AIRecipes')) },
  { path: '/DeliveryTracking', name: 'DeliveryTracking', role: 'authenticated', element: page(() => import('./pages/DeliveryTracking')) },
  { path: '/SecurityCenter', name: 'SecurityCenter', role: 'authenticated', element: page(() => import('./pages/SecurityCenter')) },

  // --- Partenaires ----------------------------------------------------------
  { path: '/PartnerDashboard', name: 'PartnerDashboard', role: 'partner', element: page(() => import('./pages/PartnerDashboard')) },
  { path: '/PartnerProducts', name: 'PartnerProducts', role: 'partner', element: page(() => import('./pages/PartnerProducts')) },
  { path: '/PartnerStats', name: 'PartnerStats', role: 'partner', element: page(() => import('./pages/PartnerStats')) },
  { path: '/PartnerAnalytics', name: 'PartnerAnalytics', role: 'partner', element: page(() => import('./pages/PartnerAnalytics')) },
  { path: '/PartnerChallenges', name: 'PartnerChallenges', role: 'partner', element: page(() => import('./pages/PartnerChallenges')) },
  { path: '/PartnerExperiences', name: 'PartnerExperiences', role: 'partner', element: page(() => import('./pages/PartnerExperiences')) },
  { path: '/PartnerPredictiveDashboard', name: 'PartnerPredictiveDashboard', role: 'partner', element: page(() => import('./pages/PartnerPredictiveDashboard')) },
  { path: '/MerchantBasketManager', name: 'MerchantBasketManager', role: 'partner', element: page(() => import('./pages/MerchantBasketManager')) },
  { path: '/StockGuardian', name: 'StockGuardian', role: 'partner', element: page(() => import('./pages/StockGuardian')) },
  { path: '/BrandCampaignManager', name: 'BrandCampaignManager', role: 'partner', element: page(() => import('./pages/BrandCampaignManager')) },

  // --- Livreurs -------------------------------------------------------------
  { path: '/DriverDashboard', name: 'DriverDashboard', role: 'driver', element: page(() => import('./pages/DriverDashboard')) },
  { path: '/DeliveryManagement', name: 'DeliveryManagement', role: 'driver', element: page(() => import('./pages/DeliveryManagement')) },
  { path: '/DeliveryOptimization', name: 'DeliveryOptimization', role: 'driver', element: page(() => import('./pages/DeliveryOptimization')) },

  // --- Administration -------------------------------------------------------
  { path: '/AdminDashboard', name: 'AdminDashboard', role: 'admin', element: page(() => import('./pages/AdminDashboard')) },
  { path: '/AdminPartners', name: 'AdminPartners', role: 'backofficeAdmin', element: page(() => import('./pages/AdminPartners')) },
];

/** Pages du backoffice : hors gabarit public, et derrière un rôle dédié. */
export const backofficeRoutes = [
  { path: '/AdminBackoffice', name: 'AdminBackoffice', role: 'backoffice', element: page(() => import('./pages/AdminBackoffice')) },
  { path: '/BackofficeUsers', name: 'BackofficeUsers', role: 'backofficeAdmin', element: page(() => import('./pages/BackofficeUsers')) },
  { path: '/BackofficeSales', name: 'BackofficeSales', role: 'backoffice', element: page(() => import('./pages/BackofficeSales')) },
  { path: '/BackofficeLogs', name: 'BackofficeLogs', role: 'backofficeAdmin', element: page(() => import('./pages/BackofficeLogs')) },
  { path: '/BackofficeTransactions', name: 'BackofficeTransactions', role: 'backoffice', element: page(() => import('./pages/BackofficeTransactions')) },
];

export const publicAuthRoutes = [
  { path: '/connexion', name: 'Login', element: page(() => import('./pages/Login')) },
  { path: '/inscription', name: 'Register', element: page(() => import('./pages/Register')) },
  { path: '/mot-de-passe-oublie', name: 'ForgotPassword', element: page(() => import('./pages/ForgotPassword')) },
  { path: '/reset-password', name: 'ResetPassword', element: page(() => import('./pages/ResetPassword')) },
];
