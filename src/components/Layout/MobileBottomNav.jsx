import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { FiHome, FiPackage, FiShoppingCart, FiList, FiHeadphones } from 'react-icons/fi';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { cartCount } = useCart();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: <FiHome size={20} />, label: t('dashboard') },
    { path: '/products', icon: <FiPackage size={20} />, label: t('products') },
    { path: '/cart', icon: <FiShoppingCart size={20} />, label: t('cart'), badge: cartCount() },
    { path: '/my-orders', icon: <FiList size={20} />, label: t('orders') },
    { path: '/chat', icon: <FiHeadphones size={20} />, label: t('support') },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label={t('bottomNavigation')}>
      <div className="mobile-bottom-nav-inner">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            {item.icon}
            {item.badge > 0 && <span className="bottom-nav-badge" aria-label={`${item.badge} ${t('items')}`}>{item.badge}</span>}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}