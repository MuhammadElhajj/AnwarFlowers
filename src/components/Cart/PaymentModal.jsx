import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { FiX, FiCreditCard, FiDollarSign, FiCheck } from 'react-icons/fi';

export default function PaymentModal({ total, onClose }) {
  const { t } = useLanguage();
  const [method, setMethod] = useState('online');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { placeOrder, calculateCost } = useCart();
  const navigate = useNavigate();

  const costs = calculateCost();

  const handleConfirm = async () => {
    if (method === 'online' && !transactionNumber) {
      toast.error(t('transactionRequired'));
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    const order = await placeOrder(
      method === 'online' ? t('onlinePayment') : t('cashOnDelivery'),
      transactionNumber
    );
    setLoading(false);
    if (order) {
      onClose();
      navigate('/my-orders');
      toast.success(t('orderSuccess'));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('payment')}</h2>
          <button className="modal-close" onClick={onClose} aria-label={t('close')}>
            <FiX size={20} />
          </button>
        </div>

        <div className="payment-summary">
          <div className="summary-row">
            <span>{t('products')} ({costs.itemCount})</span>
            <span>${costs.subtotal}</span>
          </div>
          {costs.addonsCost > 0 && (
            <div className="summary-row">
              <span>{t('addons')}</span>
              <span>${costs.addonsCost}</span>
            </div>
          )}
          <div className="summary-row">
            <span>{t('delivery')}</span>
            <span>${costs.deliveryCost}</span>
          </div>
          <div className="summary-row">
            <span>{t('wrapping')}</span>
            <span>${costs.wrappingCost}</span>
          </div>
          <div className="summary-row">
            <span>{t('tax')}</span>
            <span>${costs.tax}</span>
          </div>
          {costs.discountAmount > 0 && (
            <div className="summary-row discount">
              <span>🎫 {costs.discountLabel}</span>
              <span>-${costs.discountAmount}</span>
            </div>
          )}
          <div className="summary-total">
            <span>{t('total')}</span>
            <span>${costs.total}</span>
          </div>
        </div>

        <div className="payment-methods">
          <button
            onClick={() => setMethod('online')}
            className={`payment-method-btn ${method === 'online' ? 'active' : ''}`}
          >
            <FiCreditCard size={20} />
            <span>{t('onlinePayment')}</span>
            {method === 'online' && <FiCheck size={18} className="check-icon" />}
          </button>

          <button
            onClick={() => setMethod('cod')}
            className={`payment-method-btn ${method === 'cod' ? 'active' : ''}`}
          >
            <FiDollarSign size={20} />
            <span>{t('cashOnDelivery')}</span>
            {method === 'cod' && <FiCheck size={18} className="check-icon" />}
          </button>
        </div>

        {method === 'online' && (
          <div className="transaction-section">
            <p className="transaction-info">{t('bankAccountInfo')}</p>
            <input
              type="text"
              className="form-input"
              placeholder={t('enterTransactionNumber')}
              value={transactionNumber}
              onChange={e => setTransactionNumber(e.target.value)}
            />
          </div>
        )}

        <div className="amount-display">
          <p>{t('requiredAmount', { amount: `$${costs.total}` })}</p>
        </div>

        <button
          className="confirm-order-btn"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? t('processing') : `✅ ${t('confirmOrder')}`}
        </button>
      </div>
    </div>
  );
}