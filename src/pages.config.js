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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};