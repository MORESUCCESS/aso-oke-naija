import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore, useCartStore, useWishlistStore } from './context/stores';

// Layouts
import MainLayout  from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import HomePage       from './pages/HomePage';
import ShopPage       from './pages/ShopPage';
import ProductPage    from './pages/ProductPage';
import CartPage       from './pages/CartPage';
import CheckoutPage   from './pages/CheckoutPage';
import PaymentVerify  from './pages/PaymentVerify';
import OrderSuccess   from './pages/OrderSuccess';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import AccountPage    from './pages/AccountPage';
import OrdersPage     from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WishlistPage   from './pages/WishlistPage';
import AboutPage      from './pages/AboutPage';
import ContactPage    from './pages/ContactPage';
import NotFoundPage   from './pages/NotFoundPage';

// Admin pages
import AdminDashboard  from './pages/admin/Dashboard';
import AdminProducts   from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/Categories';
import AdminOrders     from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminCustomers  from './pages/admin/Customers';
import AdminCoupons    from './pages/admin/Coupons';
import AdminSettings   from './pages/admin/Settings';
import AdminShipping   from './pages/admin/Shipping';
import AdminMessages   from './pages/admin/Messages';

// Guards
const RequireAuth  = ({ children }) => {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};
const RequireAdmin = ({ children }) => {
  const isAdmin = useAuthStore(s => s.isAdmin)();
  return isAdmin ? children : <Navigate to="/" replace />;
};
const GuestOnly = ({ children }) => {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)();
  return !isLoggedIn ? children : <Navigate to="/account" replace />;
};

export default function App() {
  const isLoggedIn  = useAuthStore(s => s.isLoggedIn)();
  const fetchCart   = useCartStore(s => s.fetchCart);
  const fetchWish   = useWishlistStore(s => s.fetch);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCart().catch(() => {});
      fetchWish().catch(() => {});
    }
  }, [isLoggedIn]);

  return (
    <Routes>
      {/* ── PUBLIC ── */}
      <Route element={<MainLayout />}>
        <Route path="/"            element={<HomePage />} />
        <Route path="/shop"        element={<ShopPage />} />
        <Route path="/shop/:slug"  element={<ProductPage />} />
        <Route path="/cart"        element={<CartPage />} />
        <Route path="/about"       element={<AboutPage />} />
        <Route path="/contact"     element={<ContactPage />} />
        <Route path="/payment/verify"  element={<RequireAuth><PaymentVerify /></RequireAuth>} />
        <Route path="/order/success"   element={<RequireAuth><OrderSuccess /></RequireAuth>} />

        {/* Checkout — auth required */}
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />

        {/* Account */}
        <Route path="/account"         element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path="/account/orders"  element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="/account/orders/:ref" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
        <Route path="/account/wishlist" element={<RequireAuth><WishlistPage /></RequireAuth>} />

        {/* Auth */}
        <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ── ADMIN ── */}
      <Route path="/admin" element={<RequireAuth><RequireAdmin><AdminLayout /></RequireAdmin></RequireAuth>}>
        <Route index            element={<AdminDashboard />} />
        <Route path="products"  element={<AdminProducts />} />
        <Route path="products/new"      element={<AdminProductForm />} />
        <Route path="products/:id/edit" element={<AdminProductForm />} />
        <Route path="categories"element={<AdminCategories />} />
        <Route path="orders"    element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="coupons"   element={<AdminCoupons />} />
        <Route path="shipping"  element={<AdminShipping />} />
        <Route path="messages"  element={<AdminMessages />} />
        <Route path="settings"  element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
