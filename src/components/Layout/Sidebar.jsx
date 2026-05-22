import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
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
  const { t } = useLanguage();
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
      toast.success(t('couponRemoved'));
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
      <button 
        className="sidebar-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? t('closeSidebar') : t('openSidebar')}
      >
        {isOpen ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
      </button>

      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={() => setIsOpen(false)} />

      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          {/* Profile */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar-wrapper">
              <div className="sidebar-avatar">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={t('profileImage')} />
                ) : (
                  user?.firstName?.[0]?.toUpperCase() || <FiAward size={36} />
                )}
              </div>
              <div className="sidebar-avatar-online" aria-label={t('online')} />
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

          {/* Progress */}
          <div className="sidebar-progress-section">
            <div className="sidebar-progress-header">
              <span className="sidebar-progress-label">
                <FiTrendingUp size={12} /> {t('progress')}
              </span>
              <span className="sidebar-progress-value">{ordersCount} {t('ordersCount')}</span>
            </div>
            <div className="sidebar-progress-bar">
              <div className="sidebar-progress-fill" style={{ width: `${progressPercent()}%` }} />
            </div>
            {pointsToNextLevel() > 0 && (
              <div className="sidebar-next-level">
                {pointsToNextLevel()} {t('ordersToNextLevel')}
              </div>
            )}
          </div>

          {/* Points */}
          <div className="sidebar-points-display">
            <span className="sidebar-points-icon"><FiAward size={24} /></span>
            <div>
              <div className="sidebar-points-value">{points.toLocaleString()}</div>
              <div className="sidebar-points-label">{t('rewardPoints')}</div>
            </div>
          </div>

          {/* Coupons */}
          <div className="sidebar-coupons-section">
            <div className="sidebar-coupons-header-row">
              <div className="sidebar-coupons-title">
                <FiGift size={16} /> {t('availableCoupons')}
              </div>
              <button 
                className="sidebar-coupons-refresh-btn" 
                onClick={fetchUserCoupons} 
                aria-label={t('refreshCoupons')}
              >
                <FiRefreshCw size={14} />
              </button>
            </div>

            {appliedCoupon && (
              <div className="applied-coupon-banner">
                <div>
                  <div className="applied-coupon-name">
                    <FiGift size={16} /> {appliedCoupon.name || t('coupon')} {t('active')}
                  </div>
                  <div className="applied-coupon-details">
                    {t('discount')} {appliedCoupon.discount}% | {t('saving')} {getDiscountAmount(appliedCoupon)}
                  </div>
                </div>
                <button 
                  className="remove-coupon-btn" 
                  onClick={() => { removeCouponFromCart(); toast.success(t('couponRemoved')); }}
                  aria-label={t('remove')}
                >
                  <FiX size={18} />
                </button>
              </div>
            )}

            {loadingCoupons ? (
              <p className="sidebar-loading-text">{t('loadingCoupons')}</p>
            ) : userCoupons.length === 0 ? (
              <p className="sidebar-empty-coupons">
                <FiShoppingBag size={20} /><br />
                {t('completeOrdersForCoupons')}
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
                        <span className="coupon-name">{coupon.name || t('discountCoupon')}</span>
                      </div>
                      <div className="coupon-desc">
                        {t('discount')} {coupon.discount}% {coupon.type === 'delivery' ? t('onDelivery') : t('onProducts')}
                      </div>
                      <div className="coupon-discount">
                        {t('validUntil')} {formatExpiry(coupon.expiresAt)} | {t('saving')} {getDiscountAmount(coupon)}
                      </div>
                      <div className="coupon-code">{coupon.code}</div>
                      {!applied && <div className="coupon-action-hint">{t('clickToApply')}</div>}
                      {applied && <div className="coupon-action-hint applied">{t('appliedClickToCancel')}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={handleLogout} aria-label={t('logout')}>
              <FiLogOut size={16} /> {t('logout')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}