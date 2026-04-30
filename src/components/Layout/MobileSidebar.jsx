import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import { 
  FiX, FiGrid, FiPackage, FiShoppingCart, 
  FiList, FiUser, FiLogOut, FiMoon, FiSun
} from 'react-icons/fi';

export default function MobileSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // إغلاق عند تغيير الصفحة
  useEffect(() => { onClose(); }, [location.pathname]);

  // إغلاق عند ضغط Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleLogout = () => { logout(); navigate('/'); onClose(); };
  const isActive = (path) => location.pathname === path;

  const mainLinks = [
    { path: '/dashboard', icon: <FiGrid size={18} />, label: t('dashboard') },
    { path: '/products', icon: <FiPackage size={18} />, label: t('products') },
    { path: '/calculator', icon: '🧮', label: 'الحاسبة', emoji: true },
  ];

  const accountLinks = [
    { path: '/cart', icon: <FiShoppingCart size={18} />, label: t('cart'), badge: cartCount() },
    { path: '/my-orders', icon: <FiList size={18} />, label: t('orders') },
    { path: '/profile', icon: <FiUser size={18} />, label: t('profile') },
  ];

  return (
    <>
      {/* Overlay */}
      <div className={`mobile-sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />

      {/* Sidebar */}
      <aside className={`mobile-sidebar ${isOpen ? 'show' : ''}`}>
        {/* Header */}
        <div className="mobile-sidebar-header">
          <div className="mobile-sidebar-logo">
            <span className="mobile-sidebar-logo-icon">🌸</span>
            <span className="mobile-sidebar-logo-text">{t('appName')}</span>
          </div>
          <button className="mobile-sidebar-close" onClick={onClose}><FiX size={20} /></button>
        </div>

        {/* User */}
        <div className="mobile-sidebar-user">
          <div className="mobile-sidebar-avatar">
            {user?.profileImage ? <img src={user.profileImage} alt="" /> : user?.firstName?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="mobile-sidebar-username">{user?.firstName} {user?.lastName}</div>
            <div className="mobile-sidebar-email">{user?.email}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mobile-sidebar-nav">
          <div className="mobile-nav-section-title">القائمة الرئيسية</div>
          {mainLinks.map(link => (
            <button key={link.path} className={`mobile-nav-item ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => navigate(link.path)}>
              {link.emoji ? <span className="mobile-nav-emoji">{link.icon}</span> : link.icon}
              {link.label}
            </button>
          ))}

          <div className="mobile-nav-section-title">الحساب والطلبات</div>
          {accountLinks.map(link => (
            <button key={link.path} className={`mobile-nav-item ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => navigate(link.path)}>
              {link.icon} {link.label}
              {link.badge > 0 && <span className="mobile-nav-badge">{link.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Controls */}
        <div className="mobile-sidebar-controls">
          <button className="mobile-control-btn" onClick={toggleTheme}>
            {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
            {isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
          </button>
          <select className="mobile-lang-select" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="ar">🇸🇦 العربية</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>

        {/* Logout */}
        <div className="mobile-sidebar-logout">
          <button className="mobile-logout-btn" onClick={handleLogout}>
            <FiLogOut size={16} /> {t('logout')}
          </button>
        </div>
      </aside>
    </>
  );
}