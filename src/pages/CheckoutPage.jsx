import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import {
  FiArrowLeft, FiCheck, FiShield, FiCreditCard,
  FiFileText, FiPackage, FiTruck, FiGift,
  FiPercent, FiDollarSign, FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { items, calculateCost, placeOrder } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const costs = calculateCost();
  const [method, setMethod] = useState('online');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleConfirm = async () => {
    if (method === 'online' && !transactionNumber.trim()) {
      toast.error(t('transactionRequired'));
      return;
    }
    setLoading(true);
    const order = await placeOrder(
      method === 'online' ? t('onlinePayment') : t('cashOnDelivery'),
      transactionNumber.trim()
    );
    setLoading(false);
    if (order) {
      toast.success(t('orderConfirmed'));
      navigate('/my-orders');
    } else {
      toast.error(t('orderFailed'));
    }
  };

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />

      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content checkout-content">
            
            <button className="checkout-back-btn" onClick={() => navigate('/cart')}>
              <FiArrowLeft size={20} /> {t('backToCart')}
            </button>

            <h1 className="checkout-title">
              <FiCreditCard size={28} /> {t('checkout')}
            </h1>

            <div className="checkout-grid">
              {/* Order Summary */}
              <div className="checkout-summary-card">
                <h3 className="checkout-summary-title">
                  <FiFileText size={20} /> {t('orderSummary')}
                </h3>
                
                <div className="checkout-summary-details">
                  <div className="checkout-summary-row">
                    <span><FiPackage size={14} /> {t('productsCount', { count: costs.itemCount })}</span>
                    <span>${costs.subtotal}</span>
                  </div>
                  {costs.addonsCost > 0 && (
                    <div className="checkout-summary-row">
                      <span><FiStar size={14} /> {t('addons')}</span>
                      <span>${costs.addonsCost}</span>
                    </div>
                  )}
                  <div className="checkout-summary-row">
                    <span><FiTruck size={14} /> {t('delivery')}</span>
                    <span>${costs.deliveryCost}</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span><FiGift size={14} /> {t('wrapping')}</span>
                    <span>${costs.wrappingCost}</span>
                  </div>
                  <div className="checkout-summary-row">
                    <span><FiPercent size={14} /> {t('tax')}</span>
                    <span>${costs.tax}</span>
                  </div>
                  {costs.discountAmount > 0 && (
                    <div className="checkout-summary-row discount">
                      <span>{costs.discountLabel}</span>
                      <span>-${costs.discountAmount}</span>
                    </div>
                  )}
                  <hr className="checkout-divider" />
                  <div className="checkout-summary-total">
                    <span><FiDollarSign size={18} /> {t('total')}</span>
                    <span className="checkout-total-amount">${costs.total}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-payment-card">
                <h3 className="checkout-payment-title">
                  <FiCreditCard size={20} /> {t('paymentMethod')}
                </h3>

                <div className="checkout-payment-options">
                  <button
                    onClick={() => setMethod('online')}
                    className={`payment-option ${method === 'online' ? 'active' : ''}`}
                  >
                    <FiCreditCard size={20} />
                    <span>{t('onlinePayment')}</span>
                    {method === 'online' && <FiCheck size={18} className="check-icon" />}
                  </button>

                  <button
                    onClick={() => setMethod('cod')}
                    className={`payment-option ${method === 'cod' ? 'active' : ''}`}
                  >
                    <FiDollarSign size={20} />
                    <span>{t('cashOnDelivery')}</span>
                    {method === 'cod' && <FiCheck size={18} className="check-icon" />}
                  </button>
                </div>

                {method === 'online' && (
                  <div className="transaction-field">
                    <p className="transaction-label">{t('enterTransactionNumber')}</p>
                    <input
                      type="text"
                      value={transactionNumber}
                      onChange={(e) => setTransactionNumber(e.target.value)}
                      placeholder={t('transactionNumberPlaceholder')}
                      className="transaction-input"
                    />
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="confirm-order-btn"
                >
                  {loading ? (
                    <>⏳ {t('confirming')}</>
                  ) : (
                    <><FiCheck size={20} /> {t('confirmAndPay')}</>
                  )}
                </button>

                <div className="secure-payment">
                  <FiShield size={14} /> {t('securePayment')}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}