import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useAdmin } from './contexts/AdminContext';
import Footer from './components/Layout/Footer';
import MobileBottomNav from './components/Layout/MobileBottomNav';


// User Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminChatPage from './components/Admin/AdminChatPage';
import AdminAddonsPage from './components/Admin/AdminAddonsPage';
import AdminNotificationsPage from './components/Admin/AdminNotificationsPage';

// ========== Styles ==========
import './styles/base/variables.css';
import './styles/base/reset.css';
import './styles/base/typography.css';
import './styles/base/utilities.css';
import './styles/components/buttons.css';
import './styles/components/cards.css';
import './styles/components/forms.css';
import './styles/components/modal.css';
import './styles/components/badges.css';
import './styles/components/tables.css';
import './styles/components/header.css';
import './styles/components/sidebar.css';
// import './styles/pages/auth.css';
import './styles/pages/login.css';
import './styles/pages/dashboard.css';
import './styles/pages/products.css';
import './styles/pages/cart.css';
import './styles/pages/checkout.css';
import './styles/pages/profile.css';
import './styles/pages/orders.css';
import './styles/admin/admin-base.css';
import './styles/admin/admin-layout.css';
import './styles/admin/admin-components.css';
import './styles/admin/admin-dashboard.css';
import './styles/admin/admin-orders.css';
import './styles/admin/admin-chat.css';
import './styles/components/bottom-nav.css';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const savedUser = localStorage.getItem('anwar_flowers_user');
  const isAuthenticated = user || savedUser;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  const role = user?.role || localStorage.getItem('userRole');
  if (!user || role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default function App() {
  const location = useLocation();
  const { user } = useAuth();

  const hideExtrasPaths = ['/', '/register', '/admin/login'];
  const isAdminPath = location.pathname.startsWith('/admin');
  
  const showFooter = user && !hideExtrasPaths.includes(location.pathname) && !isAdminPath;
  const showBottomNav = user && !hideExtrasPaths.includes(location.pathname) && !isAdminPath;

  return (
    <>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* User (protected) */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
        <Route path="/admin/chat" element={<AdminRoute><AdminChatPage /></AdminRoute>} />
        <Route path="/admin/addons" element={<AdminRoute><AdminAddonsPage /></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><AdminNotificationsPage /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* أيقونة الشات العائمة فقط (تمت إزالة زر الدعم لأنه أصبح في الهيدر) */}
     

      {showBottomNav && <MobileBottomNav />}
    </>
  );
}