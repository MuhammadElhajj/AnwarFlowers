import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  FiShoppingCart, FiUser, FiLogOut, FiPackage,
  FiGrid, FiList, FiBell, FiCheck, FiHeadphones
} from 'react-icons/fi';
import heroLogo from '../../assets/hero.jpg';

export default function Header() {
  const { user, logout } = useAuth();
  const { t, lang, setLang, supportedLangs } = useLanguage();
  const { cartCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const notifRef = useRef(null);
  const langMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (langMenuRef.current && !langMenuRef.current.contains(e.target)) setShowLangMenu(false); };
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
    { path: '/my-orders', icon: <FiList size={16} />, label: t('orders') },
    { path: '/chat', icon: <FiHeadphones size={16} />, label: t('support') },
  ];

  return (
    <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        <div className="header-logo" onClick={() => navigate('/dashboard')}>
          <img src={heroLogo} alt="Logo" className="header-logo-img"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          <span className="header-logo-text">{t('appName')}</span>
        </div>
        <nav className="header-nav">
          {navItems.map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`header-nav-btn ${item.path && isActive(item.path) ? 'active' : ''}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <div className="language-switcher" ref={langMenuRef}>
            <button className="header-icon-btn lang-btn" onClick={() => setShowLangMenu(!showLangMenu)}>
              <span className="current-lang-flag">{supportedLangs.find(l => l.code === lang)?.flag || '🌐'}</span>
            </button>
            {showLangMenu && (
              <div className="lang-dropdown">
                {supportedLangs.map(l => (
                  <button key={l.code} className={`lang-item ${lang === l.code ? 'active' : ''}`}
                    onClick={() => { setLang(l.code); setShowLangMenu(false); }}>
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="notification-wrapper" ref={notifRef}>
            <button className="header-icon-btn notification-bell" onClick={() => setShowNotif(!showNotif)}>
              <FiBell size={18} />
              {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
            </button>
            {showNotif && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <span>{t('notifications')}</span>
                  {unreadCount > 0 && <button onClick={markAllAsRead} className="mark-all-btn"><FiCheck size={16} /> {t('markAllRead')}</button>}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? <p className="no-notifications">{t('noNotifications')}</p> : notifications.slice(0,10).map(n => (
                    <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => { if (!n.read) markAsRead(n.id); if (n.orderId) navigate('/my-orders'); setShowNotif(false); }}>
                      <p className="notification-message">{n.message}</p>
                      <span className="notification-time">{new Date(n.createdAt).toLocaleString(lang==='ar'?'ar-SA':lang==='de'?'de-DE':'en-US', {hour:'2-digit',minute:'2-digit'})}</span>
                      {!n.read && <button className="mark-read-btn" onClick={e=>{e.stopPropagation();markAsRead(n.id);}}><FiCheck size={14}/></button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="header-icon-btn cart-btn" onClick={() => navigate('/cart')}>
            <FiShoppingCart size={18} />
            {cartCount()>0 && <span className="header-badge">{cartCount()}</span>}
          </button>
          <div style={{position:'relative'}}>
            <button className="header-icon-btn" onClick={() => setShowMenu(!showMenu)}><FiUser size={18}/></button>
            {showMenu && (
              <div className="header-dropdown">
                <button className="header-dropdown-item" onClick={()=>{navigate('/profile');setShowMenu(false);}}><FiUser size={16}/> {t('profile')}</button>
                <button className="header-dropdown-item" onClick={()=>{navigate('/my-orders');setShowMenu(false);}}><FiList size={16}/> {t('orders')}</button>
                <div className="header-dropdown-divider"/>
                <button className="header-dropdown-item" onClick={()=>{logout();navigate('/');setShowMenu(false);}} style={{color:'#ef4444'}}><FiLogOut size={16}/> {t('logout')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}