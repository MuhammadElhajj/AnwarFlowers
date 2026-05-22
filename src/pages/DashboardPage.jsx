import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useRewards } from '../contexts/RewardsContext';
import { useCart } from '../contexts/CartContext';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';
import StatsCard from '../components/Charts/StatsCard';
import LazyOnViewport from '../components/Common/LazyOnViewport';
import RecentOrdersTable from '../components/RecentOrdersTable';
import {
  FiShoppingBag, FiDollarSign, FiStar, FiTrendingUp,
  FiClock, FiCheckCircle, FiPackage, FiArrowRight,
  FiAward, FiGift, FiBarChart2
} from 'react-icons/fi';

// تحميل كسول للمكونات الثقيلة (تظهر بعد التمرير)
const BarChart = lazy(() => import('../components/Charts/BarChart'));
const StarRating = lazy(() => import('../components/Charts/StarRating'));
// const RecentOrdersTable = lazy(() => import('../components/RecentOrdersTable'));
export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { points, level, levels, ordersCount, coupons, applyCoupon, progressPercent, pointsToNextLevel } = useRewards();
  const { applyCouponToCart, appliedCoupon } = useCart();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ratingDist, setRatingDist] = useState({});
  const [showRewardsPanel, setShowRewardsPanel] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');

  // جلب البيانات (نفس الكود الأصلي)
  useEffect(() => {
    if (!user) return;

    const fetchMyDashboardData = async () => {
      try {
        const myOrdersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        const ordersSnap = await getDocs(myOrdersQuery);
        let myOrders = ordersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          });

        const now = new Date();
        let filteredOrders = myOrders;
        if (timeFilter === 'today') {
          filteredOrders = myOrders.filter(o => {
            const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            return date.toDateString() === now.toDateString();
          });
        } else if (timeFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredOrders = myOrders.filter(o => {
            const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            return date >= weekAgo;
          });
        } else if (timeFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredOrders = myOrders.filter(o => {
            const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            return date >= monthAgo;
          });
        }

        let ratings = [];
        try {
          const ratingsSnap = await getDocs(collection(db, 'ratings'));
          ratings = ratingsSnap.docs.map(doc => doc.data());
        } catch (e) {
          console.warn('Failed to load ratings:', e);
        }

        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratings.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++; });
        const avgRating = ratings.length > 0
          ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
          : '0.0';

        setStats({
          totalOrders: filteredOrders.length,
          myOrders: myOrders.length,
          pendingOrders: filteredOrders.filter(o => o.status === 'pending').length,
          completedOrders: filteredOrders.filter(o => o.status === 'delivered').length,
          totalRevenue: filteredOrders
            .filter(o => o.status !== 'cancelled')
            .reduce((s, o) => s + parseFloat(o.total || 0), 0)
            .toFixed(2),
          avgRating,
          totalRatings: ratings.length,
          allTimeOrders: myOrders.length,
          allTimeRevenue: myOrders
            .filter(o => o.status !== 'cancelled')
            .reduce((s, o) => s + parseFloat(o.total || 0), 0)
            .toFixed(2)
        });
        setRecentOrders(filteredOrders.slice(0, 5));
        setRatingDist(dist);
      } catch (err) {
        console.error(t('dataLoadFailed'), err);
        toast.error(t('dataLoadFailed'));
      }
    };

    fetchMyDashboardData();
  }, [user, timeFilter, t]);

  const handleRate = async (star) => {
    if (!user || !user.uid) {
      toast.error(t('loginRequired'));
      return;
    }
    try {
      const ratingsSnap = await getDocs(collection(db, 'ratings'));
      const alreadyRated = ratingsSnap.docs.some(doc => doc.data().userId === user.uid);
      if (alreadyRated) {
        toast.error(t('alreadyRated'));
        return;
      }

      await addDoc(collection(db, 'ratings'), {
        userId: user.uid,
        rating: star,
        createdAt: new Date().toISOString()
      });

      const updatedRatingsSnap = await getDocs(collection(db, 'ratings'));
      const ratings = updatedRatingsSnap.docs.map(doc => doc.data());
      const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratings.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++; });
      const avgRating = ratings.length > 0
        ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
        : '0.0';

      setRatingDist(dist);
      setStats(prev => ({
        ...prev,
        avgRating,
        totalRatings: ratings.length
      }));
      toast.success(t('ratingSubmitted'));
    } catch (err) {
      console.error(t('ratingFailed'), err);
      toast.error(t('ratingFailed'));
    }
  };

  const handleApplyCouponFromDashboard = (coupon) => {
    if (coupon.used) {
      toast.error(t('couponAlreadyUsed'));
      return;
    }
    applyCoupon(coupon.id);
    applyCouponToCart(coupon);
    toast.success(t('couponApplied'));
  };

  const currentLevel = levels[level];

  // استخدام useMemo لتجنب إعادة حساب المصفوفة إلا عند الحاجة
  const statCards = useMemo(() => stats ? [
    {
      icon: <FiShoppingBag size={22} />,
      label: t('myOrders'),
      value: stats.myOrders?.toLocaleString(),
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.15)',
      variant: 'gold',
      trend: stats.allTimeOrders > 0 ? Math.round((stats.totalOrders / stats.allTimeOrders) * 100) : 0,
      sparkle: '📦'
    },
    {
      icon: <FiDollarSign size={22} />,
      label: t('mySpending'),
      value: `$${Number(stats.totalRevenue).toLocaleString()}`,
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.15)',
      variant: 'green',
      trend: 15,
      sparkle: '💰'
    },
    {
      icon: <FiClock size={22} />,
      label: t('pending'),
      value: stats.pendingOrders?.toLocaleString(),
      color: '#f97316',
      bgColor: 'rgba(249,115,22,0.15)',
      variant: 'orange',
      trend: -5,
      sparkle: '⏳'
    },
    {
      icon: <FiCheckCircle size={22} />,
      label: t('completed'),
      value: stats.completedOrders?.toLocaleString(),
      color: '#14b8a6',
      bgColor: 'rgba(20,184,166,0.15)',
      variant: 'teal',
      trend: 20,
      sparkle: '✅'
    },
    {
      icon: <FiStar size={22} />,
      label: t('ratings'),
      value: `${stats.avgRating} (${stats.totalRatings})`,
      color: '#a855f7',
      bgColor: 'rgba(168,85,247,0.15)',
      variant: 'violet',
      trend: Math.round(Number(stats.avgRating) * 20),
      sparkle: '⭐'
    },
    {
      icon: <FiAward size={22} />,
      label: t('myPoints'),
      value: points?.toLocaleString(),
      color: '#667eea',
      bgColor: 'rgba(102,126,234,0.15)',
      variant: 'purple',
      trend: 12,
      sparkle: '🏆'
    },
  ] : [], [stats, points, t]);

  const timeFilters = [
    { key: 'all', label: t('all') },
    { key: 'today', label: t('today') },
    { key: 'week', label: t('week') },
    { key: 'month', label: t('month') },
  ];

  const statusBadge = (status) => {
    const map = { 
      pending: 'badge-pending', 
      confirmed: 'badge-confirmed', 
      shipped: 'badge-shipped', 
      delivered: 'badge-delivered', 
      cancelled: 'badge-cancelled' 
    };
    return map[status] || 'badge-pending';
  };

  const getStatusText = (status) => {
    const map = {
      pending: t('pending'),
      confirmed: t('confirmed'),
      shipped: t('shipped'),
      delivered: t('delivered'),
      cancelled: t('cancelled')
    };
    return map[status] || t('processing');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-bg" />

      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content">
            {/* Welcome Card – يظهر فوراً */}
            <div className="welcome-card">
              <div className="welcome-text">
                <h1>{t('welcome')}، {user?.firstName || user?.displayName?.split(' ')[0]}! 🌸</h1>
                <p>{t('welcomeMessage')}</p>
                <div className="welcome-meta-row">
                  {stats && (
                    <div className="welcome-meta">
                      📦 {stats.myOrders} {t('orders')} | ⭐ {stats.avgRating} {t('rating')}
                    </div>
                  )}
                  <div className="welcome-meta" onClick={() => setShowRewardsPanel(!showRewardsPanel)}>
                    {currentLevel.icon} {currentLevel.name} | ⭐ {points.toLocaleString()} {t('pointsShort')}
                  </div>
                </div>
              </div>
              <div className="welcome-icon">💐</div>
            </div>

            {/* Rewards Panel – يظهر فقط عند الضغط (محمّل بشكل طبيعي لأنه ليس ثقيلاً) */}
            {showRewardsPanel && (
              <div className="rewards-quick-panel">
                <div>
                  <h4 className="rewards-panel-title">
                    <FiAward color={currentLevel.color} /> {t('yourLevel')}: {currentLevel.name}
                  </h4>
                  <div className="sidebar-progress-bar">
                    <div className="sidebar-progress-fill" style={{ width: `${progressPercent()}%` }} />
                  </div>
                  <p className="progress-text">
                    {ordersCount} {t('orders')} | {pointsToNextLevel() > 0 
                      ? `${pointsToNextLevel()} ${t('nextLevel')}` 
                      : t('topLevel')}
                  </p>
                </div>

                <div>
                  <h4 className="rewards-panel-title">
                    <FiGift color="#f59e0b" /> {t('yourCoupons')} ({coupons.filter(c => !c.used).length})
                  </h4>
                  <div className="coupons-list">
                    {coupons.filter(c => !c.used).length === 0 ? (
                      <p className="no-coupons-text">{t('completeOrdersToGetCoupons')}</p>
                    ) : (
                      coupons.filter(c => !c.used).slice(0, 3).map(coupon => (
                        <div
                          key={coupon.id}
                          onClick={() => handleApplyCouponFromDashboard(coupon)}
                          className={`coupon-card ${appliedCoupon?.id === coupon.id ? 'coupon-applied' : ''}`}
                        >
                          <span className="coupon-icon">{coupon.icon}</span>
                          <div className="coupon-info">
                            <div className="coupon-name">{coupon.name}</div>
                            <div className="coupon-desc">{coupon.description}</div>
                            <div className={`coupon-status ${appliedCoupon?.id === coupon.id ? 'applied' : ''}`}>
                              {appliedCoupon?.id === coupon.id ? `✅ ${t('applied')}` : `🎫 ${t('clickToApply')}`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards – تظهر فوراً لأنها أساسية */}
            {stats && (
              <>
                <div className="stats-section-header">
                  <h3 className="stats-section-title">{t('myActivity')}</h3>
                  <div className="stats-section-filter">
                    {timeFilters.map(filter => (
                      <button
                        key={filter.key}
                        className={`stats-filter-btn ${timeFilter === filter.key ? 'active' : ''}`}
                        onClick={() => setTimeFilter(filter.key)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="stats-grid">
                  {statCards.map((card, i) => <StatsCard key={i} {...card} />)}
                </div>
              </>
            )}

            {/* Overview Container – يتم تحميل المحتوى الثقيل فقط عند التمرير */}
            {stats && (
              <div className="overview-container">
                <div className="overview-header">
                  <div className="overview-title-group">
                    <div className="overview-icon-box">
                      <FiBarChart2 size={22} />
                    </div>
                    <div>
                      <h3 className="overview-title">{t('myAnalytics')}</h3>
                      <p className="overview-subtitle">{t('statsAndRatings')}</p>
                    </div>
                  </div>
                  <div className="overview-filters">
                    {timeFilters.map(filter => (
                      <button
                        key={filter.key}
                        className={`overview-filter-pill ${timeFilter === filter.key ? 'active' : ''}`}
                        onClick={() => setTimeFilter(filter.key)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overview-body">
                  <div className="overview-divider" />

                  <div className="overview-panel overview-panel-left">
                    <div className="overview-panel-header">
                      <div className="overview-panel-icon orders">
                        <FiTrendingUp size={16} />
                      </div>
                      <h4 className="overview-panel-title">{t('myOrders')}</h4>
                    </div>
                    <div className="overview-mini-stats">
                      <div className="overview-mini-stat">
                        <div className="overview-mini-stat-value">{stats.pendingOrders}</div>
                        <div className="overview-mini-stat-label">{t('pending')}</div>
                      </div>
                      <div className="overview-mini-stat">
                        <div className="overview-mini-stat-value">{stats.completedOrders}</div>
                        <div className="overview-mini-stat-label">{t('completed')}</div>
                      </div>
                      <div className="overview-mini-stat">
                        <div className="overview-mini-stat-value">{stats.myOrders}</div>
                        <div className="overview-mini-stat-label">{t('total')}</div>
                      </div>
                    </div>
                    
                    {/* بار تشارت – تحميل كسول عند التمرير */}
                    <LazyOnViewport fallback={<div className="chart-placeholder" style={{ height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }} />}>
                      <Suspense fallback={<div className="chart-placeholder" style={{ height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }} />}>
                        <BarChart data={[
                          { label: t('pending'), value: stats.pendingOrders, color: '#f97316' },
                          { label: t('completed'), value: stats.completedOrders, color: '#10b981' },
                          { label: t('allOrders'), value: stats.myOrders, color: '#667eea' },
                        ]} />
                      </Suspense>
                    </LazyOnViewport>
                  </div>

                  <div className="overview-panel">
                    <div className="overview-panel-header">
                      <div className="overview-panel-icon rating">
                        <FiStar size={16} />
                      </div>
                      <h4 className="overview-panel-title">{t('storeRatings')}</h4>
                    </div>
                    <div className="rating-quick-summary">
                      <div className="rating-quick-avg">
                        <div className="rating-quick-number">{stats.avgRating}</div>
                        <div className="rating-quick-stars">
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} size={12}
                              fill={i < Math.round(Number(stats.avgRating)) ? '#fbbf24' : 'none'}
                              color={i < Math.round(Number(stats.avgRating)) ? '#fbbf24' : 'rgba(255,255,255,0.2)'} />
                          ))}
                        </div>
                        <div className="rating-quick-total">{stats.totalRatings} {t('totalRatingsCount')}</div>
                      </div>
                      <div className="rating-quick-bars">
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = ratingDist[star] || 0;
                          const maxCount = Math.max(...Object.values(ratingDist), 1);
                          return (
                            <div key={star} className="rating-quick-bar-row">
                              <span className="rating-quick-bar-label">{star}</span>
                              <div className="rating-quick-bar-bg">
                                <div className="rating-quick-bar-fill" style={{ width: `${(count / maxCount) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* StarRating – تحميل كسول عند التمرير */}
                    <LazyOnViewport fallback={<div className="rating-placeholder" style={{ height: 150, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }} />}>
                      <Suspense fallback={<div className="rating-placeholder" style={{ height: 150, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }} />}>
                        <StarRating
                          rating={stats.avgRating}
                          totalRatings={stats.totalRatings}
                          distribution={ratingDist}
                          onRate={handleRate}
                        />
                      </Suspense>
                    </LazyOnViewport>
                  </div>
                </div>

                <div className="overview-footer">
                  <span className="overview-footer-text">
                    <span className="overview-footer-dot" />
                    {t('lastUpdate')}: {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="overview-footer-text">
                    💰 {t('mySpending')}: <strong className="revenue-strong">${Number(stats.totalRevenue).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Recent Orders – تحميل كسول عند التمرير */}
            {recentOrders.length > 0 && (
              <LazyOnViewport fallback={<div className="recent-orders-placeholder" style={{ height: 300, background: 'rgba(255,255,255,0.05)', borderRadius: 24 }} />}>
                <Suspense fallback={<div className="recent-orders-placeholder" style={{ height: 300, background: 'rgba(255,255,255,0.05)', borderRadius: 24 }} />}>
                  <div className="recent-orders">
                    <div className="recent-orders-header">
                      <h3 className="recent-orders-title"><FiPackage /> {t('myLatestOrders')}</h3>
                      <button className="view-all-btn" onClick={() => navigate('/my-orders')}>
                        {t('viewAll')} <FiArrowRight />
                      </button>
                    </div>
                    <table className="recent-orders-table">
                      <thead>
                        <tr>
                          <th>{t('orderNumber')}</th>
                          <th>{t('amount')}</th>
                          <th>{t('status')}</th>
                          <th>{t('date')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map(order => (
                          <tr key={order.id}>
                            <td className="order-id">#{order.id?.slice(0, 8)}</td>
                            <td className="order-amount">${Number(order.total).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${statusBadge(order.status)}`}>
                                {order.statusText || getStatusText(order.status)}
                              </span>
                            </td>
                            <td>
                              {order.createdAt?.toDate 
                                ? order.createdAt.toDate().toLocaleDateString('ar-SA') 
                                : new Date(order.createdAt).toLocaleDateString('ar-SA')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Suspense>
              </LazyOnViewport>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}