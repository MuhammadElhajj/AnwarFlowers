import { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminHeader from '../components/Admin/AdminHeader'; // ✅ تمت الإضافة
import {
  FiTrash2, FiChevronDown, FiSearch, FiRefreshCw,
  FiAlertTriangle, FiUser, FiPackage
} from 'react-icons/fi';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

const statuses = [
  { value: 'pending', label: 'قيد التجهيز', color: '#f59e0b' },
  { value: 'confirmed', label: 'تم التأكيد', color: '#3b82f6' },
  { value: 'shipped', label: 'تم الشحن', color: '#8b5cf6' },
  { value: 'delivered', label: 'تم التوصيل', color: '#10b981' },
  { value: 'cancelled', label: 'ملغي', color: '#ef4444' },
];

export default function AdminOrdersPage() {
  const { updateOrderStatus, deleteOrder } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }));
      setOrders(list);
    } catch (err) {
      toast.error('فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: newStatus, statusText: statuses.find(s => s.value === newStatus)?.label }
        : o
    ));
  };

  const handleDeleteConfirm = async () => {
    if (confirmDelete) {
      await deleteOrder(confirmDelete);
      setOrders(prev => prev.filter(o => o.id !== confirmDelete));
      setConfirmDelete(null);
      toast.success('تم حذف الطلب');
    }
  };

  const shortId = (id) => id?.toString().slice(0, 8) || '---';
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getAddonLabel = (key) => {
    const labels = { glitter: '✨ لمعان', spray: '🌿 رشة', crown: '👑 تاج', teddy: '🧸 دبدوب' };
    return labels[key] || key;
  };

  const getColorName = (hex) => {
    const names = {
      '#FFD700': 'ذهبي', '#FFFFFF': 'أبيض', '#000000': 'أسود',
      '#FF0000': 'أحمر', '#FF69B4': 'وردي', '#C0C0C0': 'فضي'
    };
    return names[hex] || hex;
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = searchTerm === '' ||
      o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main admin-orders-loading">
          <AdminHeader />         {/* ✅ */}
          <div className="loader-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main admin-orders">
        <AdminHeader />          {/* ✅ الهيدر الجديد */}
        {/* Header Panel – باقي المحتوى لم يتغير */}
        <div className="glass-panel-header">
          <div className="admin-orders-header">
            <h1 className="admin-orders-title">
              <FiPackage size={28} /> 📋 الطلبات
              <span className="admin-orders-count">({orders.length})</span>
            </h1>
            <button onClick={fetchOrders} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiRefreshCw /> تحديث
            </button>
          </div>

          <div className="search-filter-bar">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                placeholder="ابحث عن طلب أو عميل..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input search-input"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input filter-select"
            >
              <option value="all">جميع الحالات</option>
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="glass-panel empty-state">
            <p>📭 لا توجد طلبات مطابقة</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => {
              const isExpanded = expandedId === order.id;
              return (
                <div key={order.id} className="order-card">
                  <div
                    className={`order-card-header ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="order-card-header-left">
                      <div className="order-id-block">
                        <span className="order-id">#{shortId(order.id)}</span>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="customer-info">
                        <FiUser className="customer-icon" />
                        <span className="customer-name">{order.customer?.name || 'عميل'}</span>
                      </div>
                    </div>
                    <div className="order-card-header-right">
                      <span className={`status-badge ${order.status}`}>
                        {order.statusText || statuses.find(s => s.value === order.status)?.label || 'قيد التجهيز'}
                      </span>
                      <span className="order-total">${order.total}</span>
                      <FiChevronDown className={`expand-icon ${isExpanded ? 'rotated' : ''}`} size={20} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="order-details">
                      <div className="details-grid">
                        {/* Products */}
                        <div className="detail-section">
                          <h4>📦 المنتجات</h4>
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="product-row">
                              <span>{item.name} ×{item.quantity}</span>
                              <span>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Customization */}
                        <div className="detail-section">
                          {order.customMessage && (
                            <div style={{ marginBottom: '1rem' }}>
                              <h4>💌 الرسالة</h4>
                              <p className="message-box">"{order.customMessage}"</p>
                              <div className="message-meta">
                                <span>🎨 {getColorName(order.messageColor)}</span>
                                <span>📍 {order.messagePlacement === 'card' ? 'بطاقة خارجية' : order.messagePlacement === 'ribbon' ? 'على الشريط' : 'داخل الباقة'}</span>
                              </div>
                            </div>
                          )}
                          {order.selectedAddons?.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <h4>✨ الإضافات</h4>
                              <p>{order.selectedAddons.map(a => getAddonLabel(a)).join('، ')}</p>
                            </div>
                          )}
                          {order.wrappingColor && (
                            <div>
                              <h4>🎁 لون التغليف</h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 20, height: 20, backgroundColor: order.wrappingColor, borderRadius: '50%', border: '1px solid #fff' }} />
                                <span>{getColorName(order.wrappingColor)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cost Summary */}
                        <div className="cost-summary">
                          <div className="cost-row"><span>المنتجات</span><span>${order.subtotal || '0.00'}</span></div>
                          {order.addonsCost > 0 && (
                            <div className="cost-row"><span>الإضافات</span><span>${order.addonsCost}</span></div>
                          )}
                          <div className="cost-row"><span>التوصيل</span><span>${order.deliveryCost || '0.00'}</span></div>
                          <div className="cost-row"><span>التغليف</span><span>${order.wrappingCost || '0.00'}</span></div>
                          <div className="cost-row"><span>الضريبة</span><span>${order.tax || '0.00'}</span></div>
                          <div className="cost-row total"><span>المجموع</span><span>${order.total}</span></div>
                          <div className="payment-info">
                            💳 {order.paymentMethod || 'غير محدد'}<br />
                            {order.transactionNumber && `#${order.transactionNumber}`}
                          </div>
                          <div className="payment-info">
                            🚚 التوصيل: {order.deliveryMethod} | 🕒 {order.deliveryDate} {order.deliveryTime}
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="order-controls">
                        <div className="status-select-wrapper">
                          <label htmlFor={`status-${order.id}`} className="sr-only">تغيير الحالة</label>
                          <select
                            id={`status-${order.id}`}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="status-select"
                          >
                            {statuses.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmDelete(order.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <FiTrash2 /> حذف
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmDelete && (
          <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="confirm-content" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon">
                <FiAlertTriangle size={50} color="#f59e0b" />
              </div>
              <h3 className="confirm-title">تأكيد الحذف</h3>
              <p className="confirm-text">هل أنت متأكد أنك تريد حذف هذا الطلب نهائياً؟</p>
              <div className="confirm-actions">
                <button onClick={handleDeleteConfirm} className="btn btn-danger">نعم، احذف</button>
                <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}