import { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminHeader from '../components/Admin/AdminHeader';
import {
  FiShoppingBag, FiDollarSign, FiUsers, FiPackage,
  FiTrendingUp, FiClock, FiCheckCircle, FiBarChart2
} from 'react-icons/fi';

// مخطط شريطي بسيط
function BarChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((item, i) => (
        <div key={i} className="bar-column">
          <div
            className="bar-fill"
            style={{
              height: `${(item.value / maxValue) * 100}%`,
              backgroundColor: item.color,
            }}
          />
          <span className="bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { orders, products, users } = useAdmin();
  const [timeFilter, setTimeFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!orders || !products || !users) return;

    const now = new Date();
    let filteredOrders = [...orders];

    if (timeFilter === 'today') {
      filteredOrders = orders.filter(o => {
        const d = o.createdAt?.toDate?.() || new Date(o.createdAt);
        return d.toDateString() === now.toDateString();
      });
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(o => {
        const d = o.createdAt?.toDate?.() || new Date(o.createdAt);
        return d >= weekAgo;
      });
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(o => {
        const d = o.createdAt?.toDate?.() || new Date(o.createdAt);
        return d >= monthAgo;
      });
    }

    const totalRevenue = filteredOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    const pending = filteredOrders.filter(o => o.status === 'pending').length;
    const completed = filteredOrders.filter(o => o.status === 'delivered').length;
    const confirmed = filteredOrders.filter(o => o.status === 'confirmed').length;
    const shipped = filteredOrders.filter(o => o.status === 'shipped').length;
    const cancelled = filteredOrders.filter(o => o.status === 'cancelled').length;

    setStats({
      totalOrders: filteredOrders.length,
      totalRevenue: totalRevenue.toFixed(2),
      totalUsers: users.length,
      totalProducts: products.length,
      pending,
      completed,
      confirmed,
      shipped,
      cancelled,
    });

    setRecentOrders(filteredOrders.slice(0, 10));
    setChartData([
      { label: 'معلقة', value: pending, color: '#f59e0b' },
      { label: 'مؤكدة', value: confirmed, color: '#3b82f6' },
      { label: 'مشحونة', value: shipped, color: '#8b5cf6' },
      { label: 'مكتملة', value: completed, color: '#10b981' },
      { label: 'ملغية', value: cancelled, color: '#ef4444' },
    ]);
  }, [orders, products, users, timeFilter]);

  const filters = [
    { key: 'all', label: 'الكل' },
    { key: 'today', label: 'اليوم' },
    { key: 'week', label: 'الأسبوع' },
    { key: 'month', label: 'الشهر' },
  ];

  const statCards = stats ? [
    { icon: <FiShoppingBag size={20} />, label: 'الطلبات', value: stats.totalOrders, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { icon: <FiDollarSign size={20} />, label: 'الإيرادات', value: `$${Number(stats.totalRevenue).toLocaleString()}`, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { icon: <FiUsers size={20} />, label: 'المستخدمين', value: stats.totalUsers, color: '#667eea', bg: 'rgba(102,126,234,0.15)' },
    { icon: <FiPackage size={20} />, label: 'المنتجات', value: stats.totalProducts, color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
    { icon: <FiClock size={20} />, label: 'معلقة', value: stats.pending, color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    { icon: <FiCheckCircle size={20} />, label: 'مكتملة', value: stats.completed, color: '#14b8a6', bg: 'rgba(20,184,166,0.15)' },
  ] : [];

  if (!stats) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main">
          <AdminHeader />
          <div className="loading-container">
            <span className="loader-spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />
        <div className="admin-dashboard">
          <div className="admin-dashboard-bg" />
          <div className="admin-dashboard-content">
            {/* Welcome Card */}
            <div className="admin-welcome-card">
              <div className="admin-welcome-text">
                <h1>لوحة التحكم 🌸</h1>
                <p>مرحباً بك، نظرة عامة على أداء متجرك</p>
                <div className="admin-welcome-meta">
                  📦 {stats.totalOrders} طلب | 💰 ${Number(stats.totalRevenue).toLocaleString()}
                </div>
              </div>
              <div className="admin-welcome-icon">📊</div>
            </div>

            {/* Stats Header + Filters */}
            <div className="admin-stats-header">
              <h2 className="admin-stats-title">
                <FiBarChart2 size={18} /> إحصائيات سريعة
              </h2>
              <div className="admin-filter-group">
                {filters.map(f => (
                  <button
                    key={f.key}
                    className={`admin-filter-pill ${timeFilter === f.key ? 'active' : ''}`}
                    onClick={() => setTimeFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="admin-stats-grid">
              {statCards.map((card, i) => (
                <div className="admin-stat-card" key={i}>
                  <div className="admin-stat-card-inner">
                    <div className="admin-stat-icon-box" style={{ background: card.bg, color: card.color }}>
                      {card.icon}
                    </div>
                    <div className="admin-stat-info">
                      <div className="admin-stat-value">{card.value}</div>
                      <div className="admin-stat-label">{card.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart & Recent Orders */}
            <div className="admin-chart-orders-grid">
              <div className="admin-chart-card">
                <div className="admin-chart-title">
                  <div className="admin-chart-title-icon" style={{ background: 'rgba(56,130,246,0.15)' }}>
                    <FiTrendingUp size={18} color="#3b82f6" />
                  </div>
                  توزيع حالات الطلبات
                </div>
                <BarChart data={chartData} />
              </div>

              <div className="admin-chart-card">
                <div className="admin-chart-title">
                  <div className="admin-chart-title-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
                    <FiShoppingBag size={18} color="#f59e0b" />
                  </div>
                  أحدث الطلبات
                </div>
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>الطلب</th>
                      <th>العميل</th>
                      <th>المبلغ</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id?.slice(0, 8)}</td>
                        <td>{order.customer?.name || '—'}</td>
                        <td>${Number(order.total || 0).toLocaleString()}</td>
                        <td>
                          <span className={`status-dot ${order.status}`}>
                            {order.statusText || order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>لا توجد طلبات حديثة</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}