import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useRewards } from '../contexts/RewardsContext';
import { useCart } from '../contexts/CartContext';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import StatsCard from '../components/Charts/StatsCard';
import BarChart from '../components/Charts/BarChart';
import StarRating from '../components/Charts/StarRating';
import {
  FiShoppingBag, FiDollarSign, FiStar, FiTrendingUp,
  FiClock, FiCheckCircle, FiPackage, FiArrowRight,
  FiAward, FiGift, FiBarChart2
} from 'react-icons/fi';

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

  // ✅ جلب بيانات المستخدم الشخصية
  useEffect(() => {
    if (!user) return;

    const fetchMyDashboardData = async () => {
      try {
        // 1. جلب طلباتي فقط (بدون orderBy لتجنب الحاجة لفهرس)
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
            return dateB - dateA; // الأحدث أولاً
          });

        // 2. فلترة زمنية
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

        // 3. جلب التقييمات (عامة) – إذا فشل، نتعامل بصمت
        let ratings = [];
        try {
          const ratingsSnap = await getDocs(collection(db, 'ratings'));
          ratings = ratingsSnap.docs.map(doc => doc.data());
        } catch (e) {
          // لا نطبع تحذير، فقط ratings تبقى فارغة
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
        console.error('فشل تحميل بيانات الداشبورد:', err);
      }
    };

    fetchMyDashboardData();
  }, [user, timeFilter]);

  // تقديم تقييم جديد
  const handleRate = async (star) => {
    if (!user || !user.uid) return;
    try {
      const ratingsSnap = await getDocs(collection(db, 'ratings'));
      const alreadyRated = ratingsSnap.docs.some(doc => doc.data().userId === user.uid);
      if (alreadyRated) {
        console.error('لقد قمت بالتقييم مسبقاً');
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
    } catch (err) {
      console.error('فشل تقديم التقييم:', err);
    }
  };

  const handleApplyCouponFromDashboard = (coupon) => {
    if (coupon.used) return;
    applyCoupon(coupon.id);
    applyCouponToCart(coupon);
  };

  const currentLevel = levels[level];

  // بطاقات الإحصائيات الشخصية
  const statCards = stats ? [
    {
      icon: <FiShoppingBag size={22} />,
      label: 'طلباتي',
      value: stats.myOrders?.toLocaleString(),
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.15)',
      variant: 'gold',
      trend: stats.allTimeOrders > 0 ? Math.round((stats.totalOrders / stats.allTimeOrders) * 100) : 0,
      sparkle: '📦'
    },
    {
      icon: <FiDollarSign size={22} />,
      label: 'إنفاقي',
      value: `$${Number(stats.totalRevenue).toLocaleString()}`,
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.15)',
      variant: 'green',
      trend: 15,
      sparkle: '💰'
    },
    {
      icon: <FiClock size={22} />,
      label: 'معلقة',
      value: stats.pendingOrders?.toLocaleString(),
      color: '#f97316',
      bgColor: 'rgba(249,115,22,0.15)',
      variant: 'orange',
      trend: -5,
      sparkle: '⏳'
    },
    {
      icon: <FiCheckCircle size={22} />,
      label: 'مكتملة',
      value: stats.completedOrders?.toLocaleString(),
      color: '#14b8a6',
      bgColor: 'rgba(20,184,166,0.15)',
      variant: 'teal',
      trend: 20,
      sparkle: '✅'
    },
    {
      icon: <FiStar size={22} />,
      label: 'تقييمات',
      value: `${stats.avgRating} (${stats.totalRatings})`,
      color: '#a855f7',
      bgColor: 'rgba(168,85,247,0.15)',
      variant: 'violet',
      trend: Math.round(Number(stats.avgRating) * 20),
      sparkle: '⭐'
    },
    {
      icon: <FiAward size={22} />,
      label: 'نقاطي',
      value: points?.toLocaleString(),
      color: '#667eea',
      bgColor: 'rgba(102,126,234,0.15)',
      variant: 'purple',
      trend: 12,
      sparkle: '🏆'
    },
  ] : [];

  const quickLinks = [
    { path: '/products', icon: '🛍️', title: t('products') },
    { path: '/cart', icon: '🛒', title: t('cart') },
    { path: '/my-orders', icon: '📋', title: t('orders') },
    { path: '/profile', icon: '👤', title: t('profile') },
    { path: '/calculator', icon: '🧮', title: 'الحاسبة' },
  ];

  const statusBadge = (status) => {
    const map = { pending: 'badge-pending', confirmed: 'badge-confirmed', shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled' };
    return map[status] || 'badge-pending';
  };

  const timeFilters = [
    { key: 'all', label: 'الكل' },
    { key: 'today', label: 'اليوم' },
    { key: 'week', label: 'الأسبوع' },
    { key: 'month', label: 'الشهر' },
  ];

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />

      <div className="dashboard-layout">
        {/* Main Content */}
        <div className="dashboard-main-content">
          <div className="dashboard-content" style={{ maxWidth: '100%', paddingRight: '20px' }}>
            {/* Welcome Card */}
            <div className="welcome-card">
              <div className="welcome-text">
                <h1>{t('welcome')}، {user?.firstName || user?.displayName?.split(' ')[0]}! 🌸</h1>
                <p>متجر متخصص في أفخم بوكيهات الورد والهدايا المميزة.</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
                  {stats && (
                    <div className="welcome-meta">📦 {stats.myOrders} طلبات | ⭐ {stats.avgRating} تقييم</div>
                  )}
                  <div className="welcome-meta" style={{ cursor: 'pointer' }} onClick={() => setShowRewardsPanel(!showRewardsPanel)}>
                    {currentLevel.icon} {currentLevel.name} | ⭐ {points.toLocaleString()} نقطة
                  </div>
                </div>
              </div>
              <div className="welcome-icon">💐</div>
            </div>

            {/* Rewards Quick Panel */}
            {showRewardsPanel && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '28px',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                {/* Level Info */}
                <div>
                  <h4 style={{ color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiAward color={currentLevel.color} /> مستواك: {currentLevel.name}
                  </h4>
                  <div className="sidebar-progress-bar" style={{ marginBottom: '8px' }}>
                    <div className="sidebar-progress-fill" style={{ width: `${progressPercent()}%` }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                    {ordersCount} طلبات | {pointsToNextLevel() > 0 ? `${pointsToNextLevel()} طلبات للمستوى التالي` : '🎉 أعلى مستوى!'}
                  </p>
                </div>

                {/* Coupons */}
                <div>
                  <h4 style={{ color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiGift color="#f59e0b" /> كوبوناتك ({coupons.filter(c => !c.used).length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                    {coupons.filter(c => !c.used).length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>🛍️ أكمل طلباتك للحصول على كوبونات</p>
                    ) : (
                      coupons.filter(c => !c.used).slice(0, 3).map(coupon => (
                        <div
                          key={coupon.id}
                          onClick={() => handleApplyCouponFromDashboard(coupon)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            background: appliedCoupon?.id === coupon.id ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${appliedCoupon?.id === coupon.id ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s'
                          }}
                          onMouseEnter={e => {
                            if (appliedCoupon?.id !== coupon.id) {
                              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
                              e.currentTarget.style.background = 'rgba(245,158,11,0.06)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (appliedCoupon?.id !== coupon.id) {
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            }
                          }}>
                          <span style={{ fontSize: '1.4rem' }}>{coupon.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{coupon.name}</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>{coupon.description}</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: appliedCoupon?.id === coupon.id ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                              {appliedCoupon?.id === coupon.id ? '✅ مطبق' : '🎫 اضغط للتطبيق'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stats Section */}
            {stats && (
              <>
                <div className="stats-section-header">
                  <h3 className="stats-section-title">
                    <FiBarChart2 /> ملخص نشاطي
                  </h3>
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

            {/* Overview Container */}
            {stats && (
              <div className="overview-container">
                <div className="overview-header">
                  <div className="overview-title-group">
                    <div className="overview-icon-box">
                      <FiBarChart2 size={22} />
                    </div>
                    <div>
                      <h3 className="overview-title">تحليلاتي</h3>
                      <p className="overview-subtitle">إحصائيات وتقييمات</p>
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
                      <h4 className="overview-panel-title">طلباتي</h4>
                    </div>
                    <div className="overview-mini-stats">
                      <div className="overview-mini-stat">
                        <div className="overview-mini-stat-value">{stats.pendingOrders}</div>
                        <div className="overview-mini-stat-label">معلقة</div>
                      </div>
                      <div className="overview-mini-stat">
                        <div className="overview-mini-stat-value">{stats.completedOrders}</div>
                        <div className="overview-mini-stat-label">مكتملة</div>
                      </div>
                      <div className="overview-mini-stat">
                        <div className="overview-mini-stat-value">{stats.myOrders}</div>
                        <div className="overview-mini-stat-label">الإجمالي</div>
                      </div>
                    </div>
                    <div className="overview-chart-area">
                      <BarChart data={[
                        { label: 'معلقة', value: stats.pendingOrders, color: '#f97316' },
                        { label: 'مكتملة', value: stats.completedOrders, color: '#10b981' },
                        { label: 'كل الطلبات', value: stats.myOrders, color: '#667eea' },
                      ]} />
                    </div>
                  </div>

                  <div className="overview-panel">
                    <div className="overview-panel-header">
                      <div className="overview-panel-icon rating">
                        <FiStar size={16} />
                      </div>
                      <h4 className="overview-panel-title">تقييمات المتجر</h4>
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
                        <div className="rating-quick-total">{stats.totalRatings} تقييم</div>
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
                    <StarRating
                      rating={stats.avgRating}
                      totalRatings={stats.totalRatings}
                      distribution={ratingDist}
                      onRate={handleRate}
                    />
                  </div>
                </div>

                <div className="overview-footer">
                  <span className="overview-footer-text">
                    <span className="overview-footer-dot" />
                    آخر تحديث: {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="overview-footer-text">
                    💰 إنفاقي: <strong style={{ color: '#10b981', margin: '0 4px' }}>${Number(stats.totalRevenue).toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className="recent-orders">
                <div className="recent-orders-header">
                  <h3 className="recent-orders-title"><FiPackage /> أحدث طلباتي</h3>
                  <button className="view-all-btn" onClick={() => navigate('/my-orders')}>عرض الكل <FiArrowRight /></button>
                </div>
                <table className="recent-orders-table">
                  <thead>
                    <tr><th>رقم الطلب</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td className="order-id">#{order.id}</td>
                        <td className="order-amount">${Number(order.total).toLocaleString()}</td>
                        <td><span className={`badge ${statusBadge(order.status)}`}>{order.statusText || 'قيد التجهيز'}</span></td>
                        <td>{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('ar-SA') : new Date(order.createdAt).toLocaleDateString('ar-SA')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <Sidebar />
      </div>
    </div>
  );
}