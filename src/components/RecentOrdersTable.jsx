import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { FiPackage, FiArrowRight } from 'react-icons/fi';

export default function RecentOrdersTable({ orders }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

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
    <div className="recent-orders">
      <div className="recent-orders-header">
        <h3 className="recent-orders-title">
          <FiPackage /> {t('myLatestOrders')}
        </h3>
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
          {orders.map(order => (
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
  );
}