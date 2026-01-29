/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Achievements from './pages/Achievements';
import AdminPartners from './pages/AdminPartners';
import BecomePartner from './pages/BecomePartner';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import ChichardPlus from './pages/ChichardPlus';
import Community from './pages/Community';
import CommunityChat from './pages/CommunityChat';
import DeliveryOptimization from './pages/DeliveryOptimization';
import DeliveryTracking from './pages/DeliveryTracking';
import DriverDashboard from './pages/DriverDashboard';
import FoodCoach from './pages/FoodCoach';
import Home from './pages/Home';
import LoyaltyProgram from './pages/LoyaltyProgram';
import MyAccount from './pages/MyAccount';
import Notifications from './pages/Notifications';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import PartnerAnalytics from './pages/PartnerAnalytics';
import PartnerChallenges from './pages/PartnerChallenges';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerExperiences from './pages/PartnerExperiences';
import PartnerProducts from './pages/PartnerProducts';
import PartnerStats from './pages/PartnerStats';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import SecurityCenter from './pages/SecurityCenter';
import Settings from './pages/Settings';
import StockGuardian from './pages/StockGuardian';
import VerifyPartner from './pages/VerifyPartner';
import WeeklyChallenges from './pages/WeeklyChallenges';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryManagement from './pages/DeliveryManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Achievements": Achievements,
    "AdminPartners": AdminPartners,
    "BecomePartner": BecomePartner,
    "Cart": Cart,
    "Catalog": Catalog,
    "Checkout": Checkout,
    "ChichardPlus": ChichardPlus,
    "Community": Community,
    "CommunityChat": CommunityChat,
    "DeliveryOptimization": DeliveryOptimization,
    "DeliveryTracking": DeliveryTracking,
    "DriverDashboard": DriverDashboard,
    "FoodCoach": FoodCoach,
    "Home": Home,
    "LoyaltyProgram": LoyaltyProgram,
    "MyAccount": MyAccount,
    "Notifications": Notifications,
    "OrderConfirmation": OrderConfirmation,
    "Orders": Orders,
    "PartnerAnalytics": PartnerAnalytics,
    "PartnerChallenges": PartnerChallenges,
    "PartnerDashboard": PartnerDashboard,
    "PartnerExperiences": PartnerExperiences,
    "PartnerProducts": PartnerProducts,
    "PartnerStats": PartnerStats,
    "ProductDetail": ProductDetail,
    "Profile": Profile,
    "SecurityCenter": SecurityCenter,
    "Settings": Settings,
    "StockGuardian": StockGuardian,
    "VerifyPartner": VerifyPartner,
    "WeeklyChallenges": WeeklyChallenges,
    "AdminDashboard": AdminDashboard,
    "DeliveryManagement": DeliveryManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};