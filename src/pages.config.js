import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerProducts from './pages/PartnerProducts';
import StockGuardian from './pages/StockGuardian';
import Community from './pages/Community';
import FoodCoach from './pages/FoodCoach';
import PartnerStats from './pages/PartnerStats';
import WeeklyChallenges from './pages/WeeklyChallenges';
import DeliveryOptimization from './pages/DeliveryOptimization';
import AdminPartners from './pages/AdminPartners';
import ChichardPlus from './pages/ChichardPlus';
import DeliveryTracking from './pages/DeliveryTracking';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Catalog": Catalog,
    "ProductDetail": ProductDetail,
    "Cart": Cart,
    "Checkout": Checkout,
    "Orders": Orders,
    "Profile": Profile,
    "PartnerDashboard": PartnerDashboard,
    "PartnerProducts": PartnerProducts,
    "StockGuardian": StockGuardian,
    "Community": Community,
    "FoodCoach": FoodCoach,
    "PartnerStats": PartnerStats,
    "WeeklyChallenges": WeeklyChallenges,
    "DeliveryOptimization": DeliveryOptimization,
    "AdminPartners": AdminPartners,
    "ChichardPlus": ChichardPlus,
    "DeliveryTracking": DeliveryTracking,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};