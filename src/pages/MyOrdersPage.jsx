import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatDateTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import {
  FiChevronDown, FiRefreshCw, FiTrash2, FiAlertTriangle,
  FiPackage, FiClock, FiCheckCircle, FiTruck
} from 'react-icons/fi';
import '../styles/pages/user-pages-shared.css';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
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
      console.error(t('failedToLoadOrders'), err);
      setError(t('failedToLoadOrders'));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, t]);

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
      if (success) {
        toast.success(t('orderCancelledSuccess'));
        fetchOrders();
      } else {
        toast.error(t('orderCancelFailed'));
      }
    }
    closeConfirmModal();
  };

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
      pending: t('statusPending'),
      confirmed: t('statusConfirmed'),
      shipped: t('statusShipped'),
      delivered: t('statusDelivered'),
      cancelled: t('statusCancelled')
    };
    return map[status] || t('processing');
  };

  const formatDateSafe = (dateStr) => {
    if (!dateStr) return t('unknown');
    try { return formatDateTime(dateStr); }
    catch { return dateStr; }
  };

  const getAddonLabel = (key) => {
    const labels = {
      glitter: t('addonGlitter'),
      spray: t('addonSpray'),
      crown: t('addonCrown'),
      teddy: t('addonTeddy')
    };
    return labels[key] || key;
  };

  const getColorName = (hex) => {
    const names = {
      '#FFD700': t('colorGold'),
      '#FFFFFF': t('colorWhite'),
      '#000000': t('colorBlack'),
      '#FF0000': t('colorRed'),
      '#FF69B4': t('colorPink'),
      '#C0C0C0': t('colorSilver')
    };
    return names[hex] || hex;
  };

  const getPlacementText = (placement) => {
    const map = {
      card: t('placementCard'),
      ribbon: t('placementRibbon'),
      inside: t('placementInside')
    };
    return map[placement] || placement;
  };

  const isImageUrl = (str) => {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('http') || str.startsWith('data:') || str.startsWith('/');
  };

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />

      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content">
            <div className="page-header">
              <h1 className="page-title"><FiPackage size={28} /> {t('myOrders')}</h1>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn btn-secondary"
              >
                <FiRefreshCw style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                {isRefreshing ? t('refreshing') : t('refresh')}
              </button>
            </div>

            {loading && orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FiClock size={60} /></div>
                <h2>{t('loadingOrders')}</h2>
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FiAlertTriangle size={60} /></div>
                <h2>{error}</h2>
                <button className="btn btn-primary" onClick={handleRefresh}>{t('refresh')}</button>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FiPackage size={60} /></div>
                <h2>{t('noOrders')}</h2>
                <button className="btn btn-primary" onClick={() => navigate('/products')}>{t('browseProducts')}</button>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order, i) => (
                  <div key={order.id || i} className="order-card glass-card">
                    <div className="order-header" onClick={() => setExpanded(expanded === i ? null : i)}>
                      <div>
                        <p className="order-id">{t('orderId')}{order.id?.slice(0,8)}</p>
                        <p className="order-date">{formatDateSafe(order.createdAt)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`badge ${statusBadge(order.status)}`}>
                          {order.statusText || getStatusText(order.status)}
                        </span>
                        <span className="order-total">${order.total || '0.00'}</span>
                        <FiChevronDown style={{ transform: expanded === i ? 'rotate(180deg)' : '' }} />
                      </div>
                    </div>
                    {expanded === i && (
                      <div className="order-details">
                        {order.items?.length > 0 ? (
                          <div className="order-items">
                            {order.items.map((item, j) => (
                              <div key={j} className="order-item">
                                <span>
                                  {isImageUrl(item.image) ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px' }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                                      }}
                                    />
                                  ) : null}
                                  <span style={{ display: isImageUrl(item.image) ? 'none' : 'inline' }}>
                                    <FiPackage size={18} style={{ marginRight: '6px' }} />
                                  </span>
                                  {item.name} ×{item.quantity}
                                </span>
                                <span>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted">{t('noItems')}</p>
                        )}

                        {order.customMessage && (
                          <div className="detail-section">
                            <p>💌 {t('message')}: "{order.customMessage}"</p>
                            {order.messageColor && <p>🎨 {t('color')}: {getColorName(order.messageColor)}</p>}
                            {order.messagePlacement && (
                              <p>📍 {t('placement')}: {getPlacementText(order.messagePlacement)}</p>
                            )}
                          </div>
                        )}

                        {order.selectedAddons?.length > 0 && (
                          <div className="detail-section">
                            <p>✨ {t('addons')}: {order.selectedAddons.map(a => getAddonLabel(a)).join('، ')}</p>
                          </div>
                        )}

                        {order.wrappingColor && (
                          <div className="detail-section">
                            <p>🎁 {t('wrappingColor')}: 
                              <span style={{
                                backgroundColor: order.wrappingColor,
                                display: 'inline-block',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                verticalAlign: 'middle',
                                margin: '0 6px',
                                border: '1px solid #ffffff33'
                              }} />
                              {getColorName(order.wrappingColor)}
                            </p>
                          </div>
                        )}

                        <p className="detail-section">
                          💳 {order.paymentMethod || t('unknown')}
                          {order.transactionNumber && ` | ${t('transactionNumber')}: ${order.transactionNumber}`}
                        </p>

                        {order.status === 'pending' && (
                          <button className="btn btn-danger" style={{ marginTop: '12px' }} onClick={() => openConfirmModal(order.id)}>
                            <FiTrash2 /> {t('cancelOrder')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Sidebar />
      </div>

      {confirmModal.open && (
        <div className="modal-overlay" onClick={closeConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <FiAlertTriangle size={50} color="var(--warning)" />
            <h3 style={{ color: 'var(--text-primary)', margin: '16px 0' }}>{t('confirmCancelTitle')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
              {t('confirmCancelMessage')}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-danger" onClick={handleConfirmCancel}><FiTrash2 /> {t('yes')}</button>
              <button className="btn btn-secondary" onClick={closeConfirmModal}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}