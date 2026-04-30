import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiShoppingBag, FiUsers, FiSettings,
  FiMessageCircle, FiTag, FiPercent, FiBell, FiMenu, FiX
} from 'react-icons/fi';

const menuItems = [
  { path: '/admin/dashboard', icon: <FiGrid size={18} />, label: 'الرئيسية' },
  { path: '/admin/products', icon: <FiPackage size={18} />, label: 'المنتجات' },
  { path: '/admin/orders', icon: <FiShoppingBag size={18} />, label: 'الطلبات' },
  { path: '/admin/users', icon: <FiUsers size={18} />, label: 'المستخدمين' },
  { path: '/admin/addons', icon: <FiTag size={18} />, label: 'الإضافات' },
  { path: '/admin/settings', icon: <FiPercent size={18} />, label: 'الضرائب والإعدادات' },
  { path: '/admin/notifications', icon: <FiBell size={18} />, label: 'الإشعارات' },
  { path: '/admin/chat', icon: <FiMessageCircle size={18} />, label: 'الدردشات' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // إغلاق القائمة عند تغيير المسار (للهاتف)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // إغلاق القائمة عند الضغط على زر Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // ✅ تعريض دالة للتحكم من الخارج (الهيدر)
  useEffect(() => {
    window.__toggleAdminSidebar = () => setIsOpen(prev => !prev);
    return () => {
      delete window.__toggleAdminSidebar;
    };
  }, []);

  return (
    <>
     

    

      {/* الشريط الجانبي */}
      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <h2>🌸 لوحة التحكم</h2>
          <span>متجر بوكيهات أنور</span>
        </div>
        <div className="admin-sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setIsOpen(false); }}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}