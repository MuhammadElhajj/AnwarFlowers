import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './styles/base/index';

// مكون تحميل بسيط
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f0f1a' }}>
    <div style={{ color: '#fff', fontSize: '1.2rem' }}>جاري التحميل...</div>
  </div>
);

// ========== التخطيطات (تحميل كسول أيضاً إن أردت) ==========
const UserLayout = lazy(() => import('./components/Layout/UserLayout'));
const AdminLayout = lazy(() => import('./components/Layout/AdminLayout'));

// ========== صفحات المستخدم ==========
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));

// ========== صفحات المدير ==========
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const AdminChatPage = lazy(() => import('./components/Admin/AdminChatPage'));
const AdminAddonsPage = lazy(() => import('./components/Admin/AdminAddonsPage'));
const AdminNotificationsPage = lazy(() => import('./components/Admin/AdminNotificationsPage'));

// ========== حماية المسارات ==========
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const savedUser = localStorage.getItem('anwar_flowers_user');
  if (!user && !savedUser) return <Navigate to="/" replace />;
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
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* صفحات المصادقة (بدون تخطيط) */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* صفحات المستخدم داخل UserLayout */}
        <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>

        {/* دخول المدير (بدون تخطيط) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* صفحات المدير داخل AdminLayout مع حماية AdminRoute */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/chat" element={<AdminChatPage />} />
          <Route path="/admin/addons" element={<AdminAddonsPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        </Route>

        {/* التوجيه لأي مسار غير معروف */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}