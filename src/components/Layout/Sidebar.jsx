import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRewards } from '../../contexts/RewardsContext';
import { useCart } from '../../contexts/CartContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiLogOut, FiGift, FiTrendingUp, FiChevronLeft, FiChevronRight, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { points, level, levels, ordersCount, progressPercent, pointsToNextLevel } = useRewards();
  const { calculateCost, applyCouponToCart, removeCouponFromCart, appliedCoupon } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // كوبونات المستخدم (تُجلب من Firestore)
  const [userCoupons, setUserCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  const fetchUserCoupons = async () => {
    if (!user?.uid) return;
    setLoadingCoupons(true);
    try {
      // جلب الكوبونات غير المستخدمة فقط
      const q = query(
        collection(db, 'userCoupons'),
        where('userId', '==', user.uid),
        where('used', '==', false)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date().toISOString(),
        expiresAt: doc.data().expiresAt || null
      }));
      // ترتيب تنازلي يدوي حسب التاريخ
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setUserCoupons(list);
    } catch (err) {
      console.error('فشل جلب كوبونات المستخدم:', err);
      // محاولة بديلة بدون شرط used (ثم نفلتر يدوياً)
      try {
        const fallbackQ = query(collection(db, 'userCoupons'), where('userId', '==', user.uid));
        const snap = await getDocs(fallbackQ);
        const list = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.used === false)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setUserCoupons(list);
      } catch (err2) {
        console.error(err2);
      }
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchUserCoupons();
  }, [user?.uid, ordersCount]);

  const currentLevel = levels[level];
  const costs = calculateCost();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ✅ تطبيق/إلغاء الكوبون بناءً على نقرة واحدة
  const handleCouponClick = (coupon) => {
    // إذا كان الكوبون هو نفسه المُطبق، قم بإلغائه
    if (appliedCoupon?.id === coupon.id || appliedCoupon?.code === coupon.code) {
      removeCouponFromCart();
      toast.success('تم إلغاء الكوبون');
      return;
    }
    // وإلا قم بتطبيق الكوبون (سيزيل الكوبون السابق تلقائياً)
    applyCouponToCart(coupon.code);
  };

  const getDiscountAmount = (coupon) => {
    if (!coupon || !costs) return '$0.00';
    if (coupon.type === 'delivery') {
      const deliveryCost = parseFloat(costs.deliveryCost) || 5;
      return `$${((deliveryCost * coupon.discount) / 100).toFixed(2)}`;
    }
    const subtotal = parseFloat(costs.subtotal) || 0;
    return `$${((subtotal * coupon.discount) / 100).toFixed(2)}`;
  };

  const formatExpiry = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  // هل كوبون معين هو المطبق حالياً؟
  const isCouponApplied = (coupon) => {
    return appliedCoupon?.code === coupon.code;
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
      </button>

      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={() => setIsOpen(false)} />

      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          {/* الملف الشخصي */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar-wrapper">
              <div className="sidebar-avatar">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="" />
                ) : (
                  user?.firstName?.[0]?.toUpperCase() || '👤'
                )}
              </div>
              <div className="sidebar-avatar-online" />
            </div>
            <div className="sidebar-username">{user?.firstName} {user?.lastName}</div>
            <div className="sidebar-email">{user?.email}</div>
            <div className="sidebar-level-badge" style={{
              background: `${currentLevel.color}15`,
              color: currentLevel.color,
              borderColor: `${currentLevel.color}30`
            }}>
              {currentLevel.icon} {currentLevel.name}
            </div>
          </div>

          {/* التقدم والمستوى */}
          <div className="sidebar-progress-section">
            <div className="sidebar-progress-header">
              <span className="sidebar-progress-label">
                <FiTrendingUp size={12} /> التقدم
              </span>
              <span className="sidebar-progress-value">{ordersCount} طلبات</span>
            </div>
            <div className="sidebar-progress-bar">
              <div className="sidebar-progress-fill" style={{ width: `${progressPercent()}%` }} />
            </div>
            {pointsToNextLevel() > 0 && (
              <div className="sidebar-next-level">
                {pointsToNextLevel()} طلبات للمستوى التالي
              </div>
            )}
          </div>

          {/* النقاط */}
          <div className="sidebar-points-display">
            <span className="sidebar-points-icon">⭐</span>
            <div>
              <div className="sidebar-points-value">{points.toLocaleString()}</div>
              <div className="sidebar-points-label">نقطة مكافآت</div>
            </div>
          </div>

          {/* الكوبونات المتاحة */}
          <div className="sidebar-coupons-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="sidebar-coupons-title">
                <FiGift size={16} /> الكوبونات المتاحة
              </div>
              <button 
                onClick={fetchUserCoupons} 
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                title="تحديث الكوبونات"
              >
                <FiRefreshCw size={14} />
              </button>
            </div>

            {/* عرض الكوبون المُطبق حالياً (إن وُجد) */}
            {appliedCoupon && (
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.15)', 
                border: '1px solid rgba(16, 185, 129, 0.4)', 
                borderRadius: '12px', 
                padding: '10px', 
                marginTop: '10px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    🎫 {appliedCoupon.name || 'كوبون'} نشط
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    خصم {appliedCoupon.discount}% | توفير {getDiscountAmount(appliedCoupon)}
                  </div>
                </div>
                <button 
                  onClick={() => { removeCouponFromCart(); toast.success('تم إلغاء الكوبون'); }}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <FiX size={18} />
                </button>
              </div>
            )}

            {loadingCoupons ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>
                جاري تحميل الكوبونات...
              </p>
            ) : userCoupons.length === 0 ? (
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.35)',
                textAlign: 'center',
                padding: '24px 0',
                lineHeight: '1.6'
              }}>
                🛍️ أكمل طلباتك<br/>للحصول على كوبونات خصم
              </p>
            ) : (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {userCoupons.map(coupon => {
                  const applied = isCouponApplied(coupon);
                  return (
                    <div
                      key={coupon.id}
                      className={`coupon-card ${applied ? 'applied' : ''}`}
                      onClick={() => handleCouponClick(coupon)}
                      style={{
                        cursor: 'pointer',
                        border: applied ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                        position: 'relative'
                      }}
                    >
                      {applied && (
                        <span style={{
                          position: 'absolute', top: '6px', right: '6px',
                          background: '#10b981', color: '#fff', borderRadius: '50%',
                          width: '20px', height: '20px', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem'
                        }}>
                          <FiCheck size={14} />
                        </span>
                      )}
                      <div className="coupon-header">
                        <span className="coupon-icon">🎫</span>
                        <span className="coupon-name">{coupon.name || 'كوبون خصم'}</span>
                      </div>
                      <div className="coupon-desc">
                        خصم {coupon.discount}% {coupon.type === 'delivery' ? 'على التوصيل' : 'على المنتجات'}
                      </div>
                      <div className="coupon-discount">
                        📅 صالح حتى {formatExpiry(coupon.expiresAt)} | 💰 توفير {getDiscountAmount(coupon)}
                      </div>
                      <div className="coupon-code" style={{
                        fontFamily: 'monospace', fontSize: '0.8rem', marginTop: '4px',
                        background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px'
                      }}>
                        {coupon.code}
                      </div>
                      {!applied && (
                        <div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--accent)' }}>
                          اضغط للتطبيق
                        </div>
                      )}
                      {applied && (
                        <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#10b981' }}>
                          ✅ مُطبق حالياً – اضغط للإلغاء
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* تسجيل الخروج */}
          <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={handleLogout}>
              <FiLogOut size={16} /> تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}