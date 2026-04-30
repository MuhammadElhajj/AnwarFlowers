import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiBell, FiLogOut, FiMenu } from 'react-icons/fi';
import { useNotifications } from '../../contexts/NotificationContext';
import heroLogo from '../../assets/hero.jpg';


export default function AdminHeader() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const pageTitles = {
    '/admin/dashboard': 'الرئيسية',
    '/admin/products': 'المنتجات',
    '/admin/orders': 'الطلبات',
    '/admin/users': 'المستخدمين',
    '/admin/addons': 'الإضافات',
    '/admin/settings': 'الإعدادات',
    '/admin/notifications': 'الإشعارات',
    '/admin/chat': 'الدردشات',
  };
  const currentTitle = pageTitles[location.pathname] || 'لوحة التحكم';

  const handleToggleSidebar = () => {
    if (window.__toggleAdminSidebar) {
      window.__toggleAdminSidebar();
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header-inner">
        <div className="admin-header-left">
          {/* زر الهامبرغر يظهر فقط على الجوال */}
          <button className="admin-hamburger" onClick={handleToggleSidebar} aria-label="فتح القائمة">
            <FiMenu size={22} />
          </button>

          <div className="admin-logo" onClick={() => navigate('/admin/dashboard')}>
            <img src={heroLogo} alt="Logo" className="admin-logo-img" />
            <div>
              <h1 className="admin-logo-text">Nivia</h1>
              <span className="admin-logo-sub">لوحة التحكم</span>
            </div>
          </div>
          <div className="admin-page-title">{currentTitle}</div>
        </div>

        <div className="admin-header-right">
          <div className="admin-header-actions">
            <button className="admin-header-icon" onClick={() => navigate('/admin/notifications')}>
              <FiBell size={18} />
              {unreadCount > 0 && <span className="admin-badge">{unreadCount}</span>}
            </button>
            <div className="admin-user-info">
              <span>{user?.firstName || 'المدير'}</span>
            </div>
            <button className="admin-header-icon" onClick={handleLogout} title="تسجيل الخروج">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}