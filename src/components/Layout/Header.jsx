import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useNotifications } from '../../contexts/NotificationContext'; // ✅ استيراد الإشعارات
import {
  FiShoppingCart, FiUser, FiLogOut, FiMoon, FiSun, FiPackage,
  FiGrid, FiList, FiBell, FiCheck
} from 'react-icons/fi';
import heroLogo from '../../assets/hero.jpg';

export default function Header() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { cartCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(); // ✅
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false); // ✅ حالة إظهار قائمة الإشعارات
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const notifRef = useRef(null); // ✅ لإغلاق القائمة عند النقر خارجها

  // إغلاق قائمة الإشعارات عند النقر خارجها
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: <FiGrid size={16} />, label: t('dashboard') },
    { path: '/products', icon: <FiPackage size={16} />, label: t('products') },
    { path: '/calculator', icon: '🧮', label: 'الحاسبة' },
    { path: '/my-orders', icon: <FiList size={16} />, label: t('orders') },
  ];

  return (
    <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        <div className="header-logo" onClick={() => navigate('/dashboard')}>
          <img
            src={heroLogo}
            alt="Nivia Logo"
            className="header-logo-img"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <span className="header-logo-text">Anwar Flowers</span>
        </div>

        <nav className="header-nav">
          {navItems.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`header-nav-btn ${isActive(item.path) ? 'active' : ''}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <select value={lang} onChange={(e) => setLang(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
            <option value="ar">ar</option>
            <option value="en">en</option>
          </select>

          {/* ✅ زر الإشعارات (جنب السلة) */}
          <div className="notification-wrapper" ref={notifRef}>
            <button
              className="header-icon-btn notification-bell"
              onClick={() => setShowNotif(!showNotif)}
              aria-label="الإشعارات"
            >
              <FiBell size={18} />
              {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
            </button>

            {showNotif && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <span>الإشعارات</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="mark-all-btn">
                      <FiCheck size={16} /> تعليم الكل مقروء
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <p className="no-notifications">لا توجد إشعارات</p>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        className={`notification-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => {
                          if (!n.read) markAsRead(n.id);
                          if (n.orderId) navigate('/my-orders');
                          setShowNotif(false);
                        }}
                      >
                        <p className="notification-message">{n.message}</p>
                        <span className="notification-time">
                          {new Date(n.createdAt).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!n.read && (
                          <button
                            className="mark-read-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            title="تعليم كمقروء"
                          >
                            <FiCheck size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* زر السلة */}
          <button className="header-icon-btn cart-btn" onClick={() => navigate('/cart')}>
            <FiShoppingCart size={18} />
            {cartCount() > 0 && <span className="header-badge">{cartCount()}</span>}
          </button>

          <div style={{ position: 'relative' }}>
            <button className="header-icon-btn" onClick={() => setShowMenu(!showMenu)}>
              <FiUser size={18} />
            </button>

            {showMenu && (
              <div className="header-dropdown">
                <button className="header-dropdown-item" onClick={() => { navigate('/profile'); setShowMenu(false); }}>
                  <FiUser size={16} /> {t('profile')}
                </button>
                <button className="header-dropdown-item" onClick={() => { navigate('/my-orders'); setShowMenu(false); }}>
                  <FiList size={16} /> {t('orders')}
                </button>
                <div className="header-dropdown-divider" />
                <button className="header-dropdown-item" onClick={() => { logout(); navigate('/'); setShowMenu(false); }}
                  style={{ color: '#ef4444' }}>
                  <FiLogOut size={16} /> {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}