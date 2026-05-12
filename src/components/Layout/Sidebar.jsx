import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRewards } from '../../contexts/RewardsContext';
import { useCart } from '../../contexts/CartContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  FiLogOut, FiGift, FiTrendingUp, FiChevronLeft, FiChevronRight, 
  FiRefreshCw, FiCheck, FiX, FiAward, FiShoppingBag 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { points, level, levels, ordersCount, progressPercent, pointsToNextLevel } = useRewards();
  const { calculateCost, applyCouponToCart, removeCouponFromCart, appliedCoupon } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const [userCoupons, setUserCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  const fetchUserCoupons = async () => {
    if (!user?.uid) return;
    setLoadingCoupons(true);
    try {
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
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setUserCoupons(list);
    } catch (err) {
      try {
        const fallbackQ = query(collection(db, 'userCoupons'), where('userId', '==', user.uid));
        const snap = await getDocs(fallbackQ);
        const list = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => c.used === false)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setUserCoupons(list);
      } catch (err2) { /* ignore */ }
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

  const handleCouponClick = (coupon) => {
    if (appliedCoupon?.id === coupon.id || appliedCoupon?.code === coupon.code) {
      removeCouponFromCart();
      toast.success('تم إلغاء الكوبون');
      return;
    }
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
                  user?.firstName?.[0]?.toUpperCase() || <FiAward size={36} />
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
            <span className="sidebar-points-icon"><FiAward size={24} /></span>
            <div>
              <div className="sidebar-points-value">{points.toLocaleString()}</div>
              <div className="sidebar-points-label">نقطة مكافآت</div>
            </div>
          </div>

          {/* الكوبونات المتاحة */}
          <div className="sidebar-coupons-section">
            <div className="sidebar-coupons-header-row">
              <div className="sidebar-coupons-title">
                <FiGift size={16} /> الكوبونات المتاحة
              </div>
              <button className="sidebar-coupons-refresh-btn" onClick={fetchUserCoupons} title="تحديث الكوبونات">
                <FiRefreshCw size={14} />
              </button>
            </div>

            {appliedCoupon && (
              <div className="applied-coupon-banner">
                <div>
                  <div className="applied-coupon-name">
                    <FiGift size={16} /> {appliedCoupon.name || 'كوبون'} نشط
                  </div>
                  <div className="applied-coupon-details">
                    خصم {appliedCoupon.discount}% | توفير {getDiscountAmount(appliedCoupon)}
                  </div>
                </div>
                <button className="remove-coupon-btn" onClick={() => { removeCouponFromCart(); toast.success('تم إلغاء الكوبون'); }}>
                  <FiX size={18} />
                </button>
              </div>
            )}

            {loadingCoupons ? (
              <p className="sidebar-loading-text">جاري تحميل الكوبونات...</p>
            ) : userCoupons.length === 0 ? (
              <p className="sidebar-empty-coupons">
                <FiShoppingBag size={20} /><br />
                أكمل طلباتك للحصول على كوبونات خصم
              </p>
            ) : (
              <div className="sidebar-coupons-list">
                {userCoupons.map(coupon => {
                  const applied = isCouponApplied(coupon);
                  return (
                    <div
                      key={coupon.id}
                      className={`coupon-card ${applied ? 'applied' : ''}`}
                      onClick={() => handleCouponClick(coupon)}
                    >
                      {applied && (
                        <span className="applied-check-badge">
                          <FiCheck size={14} />
                        </span>
                      )}
                      <div className="coupon-header">
                        <span className="coupon-icon"><FiGift size={18} /></span>
                        <span className="coupon-name">{coupon.name || 'كوبون خصم'}</span>
                      </div>
                      <div className="coupon-desc">
                        خصم {coupon.discount}% {coupon.type === 'delivery' ? 'على التوصيل' : 'على المنتجات'}
                      </div>
                      <div className="coupon-discount">
                        صالح حتى {formatExpiry(coupon.expiresAt)} | توفير {getDiscountAmount(coupon)}
                      </div>
                      <div className="coupon-code">{coupon.code}</div>
                      {!applied && <div className="coupon-action-hint">اضغط للتطبيق</div>}
                      {applied && <div className="coupon-action-hint applied">✅ مُطبق – اضغط للإلغاء</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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