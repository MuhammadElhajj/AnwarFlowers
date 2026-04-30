import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatDateTime } from '../utils/dateUtils';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import { FiChevronDown, FiRefreshCw, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { deleteMyOrder } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState({ open: false, orderId: null });

  const fetchOrders = useCallback(async () => {
    if (!user || !user.uid) return;
    setLoading(true);
    setError('');
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : data.createdAt || new Date().toISOString()
        };
      });
      setOrders(list);
    } catch (err) {
      console.error('فشل جلب الطلبات:', err);
      setError(err.message || 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const openConfirmModal = (orderId) => {
    setConfirmModal({ open: true, orderId });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, orderId: null });
  };

  const handleConfirmCancel = async () => {
    if (confirmModal.orderId) {
      const success = await deleteMyOrder(confirmModal.orderId);
      if (success) fetchOrders();
    }
    closeConfirmModal();
  };

  const statusBadge = (status) => {
    const map = {
      pending: 'badge-pending', confirmed: 'badge-confirmed',
      shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled'
    };
    return map[status] || 'badge-pending';
  };

  const formatDateSafe = (dateStr) => {
    if (!dateStr) return 'غير معروف';
    try { return formatDateTime(dateStr); }
    catch { return dateStr; }
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

  // ✅ دالة لاكتشاف إن كان النص رابط صورة صالحاً (URL أو Base64)
  const isImageUrl = (str) => {
    if (!str || typeof str !== 'string') return false;
    return (
      str.startsWith('http') ||
      str.startsWith('data:') ||
      str.startsWith('/')
    );
  };

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />
      
      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h1 className="cart-title">📋 طلباتي</h1>
              <button onClick={handleRefresh} disabled={isRefreshing} className="view-all-btn">
                <FiRefreshCw style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} /> 
                {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
              </button>
            </div>

            {loading && orders.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">⏳</div>
                <h2>جاري تحميل الطلبات...</h2>
              </div>
            ) : error ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">⚠️</div>
                <h2>{error}</h2>
                <button className="checkout-btn" style={{ maxWidth: '300px', margin: '20px auto' }}
                  onClick={handleRefresh}>إعادة المحاولة</button>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">📭</div>
                <h2>لا توجد طلبات</h2>
                <button className="checkout-btn" style={{ maxWidth: '300px', margin: '20px auto' }}
                  onClick={() => navigate('/products')}>تصفح المنتجات</button>
              </div>
            ) : (
              orders.map((order, i) => (
                <div key={order.id || i} className="order-card">
                  <div className="order-header" onClick={() => setExpanded(expanded === i ? null : i)}>
                    <div>
                      <p className="order-id">#{order.id || 'طلب'}</p>
                      <p className="order-date">{formatDateSafe(order.createdAt)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge ${statusBadge(order.status)}`}>{order.statusText || 'قيد التجهيز'}</span>
                      <span className="order-total">${order.total || '0.00'}</span>
                      <FiChevronDown style={{ transform: expanded === i ? 'rotate(180deg)' : '' }} />
                    </div>
                  </div>
                  {expanded === i && (
                    <div className="order-details">
                      {order.items && order.items.length > 0 ? (
                        <div className="order-items">
                          {order.items.map((item, j) => (
                            <div key={j} className="order-item">
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* ✅ صورة مصغرة إن كان الرابط صحيحاً، مع أيقونة احتياطية ثابتة */}
                                {isImageUrl(item.image) ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      objectFit: 'cover',
                                      borderRadius: '6px'
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      // إظهار الأيقونة الاحتياطية
                                      e.target.nextSibling.style.display = 'inline';
                                    }}
                                  />
                                ) : null}
                                {/* النص الاحتياطي يظهر فقط إذا لم تكن صورة أو فشل التحميل */}
                                <span style={{
                                  display: isImageUrl(item.image) ? 'none' : 'inline',
                                  fontSize: '20px'
                                }}>
                                  🌸
                                </span>
                                {item.name} ×{item.quantity}
                              </span>
                              <span>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-secondary)' }}>لا توجد عناصر في هذا الطلب</p>
                      )}

                      {order.customMessage && (
                        <div className="order-customization" style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          <p>💌 رسالة: "{order.customMessage}"</p>
                          {order.messageColor && <p>🎨 لون الكتابة: {getColorName(order.messageColor)}</p>}
                          {order.messagePlacement && <p>📍 مكان الكتابة: {order.messagePlacement === 'card' ? 'بطاقة خارجية' : order.messagePlacement === 'ribbon' ? 'على الشريط' : 'داخل الباقة'}</p>}
                        </div>
                      )}

                      {order.selectedAddons?.length > 0 && (
                        <div className="order-addons" style={{ marginTop: '8px', color: 'var(--accent)', fontSize: '14px' }}>
                          <p>✨ إضافات: {order.selectedAddons.map(a => getAddonLabel(a)).join('، ')}</p>
                        </div>
                      )}

                      {order.wrappingColor && (
                        <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          <p>🎁 لون التغليف: 
                            <span style={{
                              display: 'inline-block', width: '16px', height: '16px',
                              backgroundColor: order.wrappingColor, borderRadius: '50%',
                              verticalAlign: 'middle', margin: '0 6px',
                              border: '1px solid var(--border-primary)'
                            }}></span>
                            {getColorName(order.wrappingColor)}
                          </p>
                        </div>
                      )}

                      {order.addonsCost > 0 && (
                        <p style={{ color: 'var(--accent)', fontSize: '14px', marginTop: '8px' }}>
                          💰 تكلفة الإضافات: ${order.addonsCost}
                        </p>
                      )}

                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                        💳 {order.paymentMethod || 'غير محدد'}
                        {order.transactionNumber && ` | رقم العملية: ${order.transactionNumber}`}
                      </p>

                      {order.status === 'pending' && (
                        <div style={{ marginTop: '12px' }}>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirmModal(order.id);
                            }}
                          >
                            <FiTrash2 size={14} style={{ marginRight: '6px' }} />
                            إلغاء الطلب
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <Sidebar />
      </div>

      {confirmModal.open && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '50px', marginBottom: '15px', color: 'var(--warning)' }}>
              <FiAlertTriangle />
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>تأكيد إلغاء الطلب</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
              هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟<br />
              <span style={{ fontSize: '13px', color: 'var(--danger)' }}>لا يمكن التراجع عن هذا الإجراء.</span>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-danger" onClick={handleConfirmCancel}>
                <FiTrash2 size={16} style={{ marginRight: '6px' }} />
                نعم، إلغاء الطلب
              </button>
              <button className="btn btn-secondary" onClick={closeConfirmModal}>
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}