import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';
import { FiX, FiCreditCard, FiDollarSign, FiCheck } from 'react-icons/fi';

export default function PaymentModal({ total, onClose }) {
  const [method, setMethod] = useState('online');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { placeOrder, clearCart, calculateCost } = useCart(); // ✅ استدعاء calculateCost
  const navigate = useNavigate();

  const costs = calculateCost(); // ✅ حساب التكاليف لمرة واحدة

  const handleConfirm = async () => {
    if (method === 'online' && !transactionNumber) {
      toast.error('أدخل رقم التحويل');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    const order = await placeOrder(method === 'online' ? 'دفع إلكتروني' : 'الدفع عند الاستلام', transactionNumber);
    setLoading(false);
    if (order) {
      onClose();
      navigate('/my-orders');
      toast.success('🎉 تم الطلب بنجاح!');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">💳 الدفع</h2>
          <button className="modal-close" onClick={onClose}><FiX size={20} /></button>
        </div>

        {/* ✅ ملخص التكاليف */}
        <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
          <div className="summary-row"><span>المنتجات ({costs.itemCount})</span><span>${costs.subtotal}</span></div>
          {costs.addonsCost > 0 && (
            <div className="summary-row"><span>✨ الإضافات</span><span>${costs.addonsCost}</span></div>
          )}
          <div className="summary-row"><span>التوصيل</span><span>${costs.deliveryCost}</span></div>
          <div className="summary-row"><span>التغليف</span><span>${costs.wrappingCost}</span></div>
          <div className="summary-row"><span>الضريبة</span><span>${costs.tax}</span></div>
          {costs.discountAmount > 0 && (
            <div className="summary-row" style={{ color: 'var(--success)' }}>
              <span>🎫 {costs.discountLabel}</span>
              <span>-${costs.discountAmount}</span>
            </div>
          )}
          <div className="summary-total" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--accent)' }}>
            <span>المجموع</span>
            <span>${costs.total}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setMethod('online')}
            className="product-btn" style={{ background: method === 'online' ? 'var(--gradient-primary)' : 'var(--bg-input)', color: method === 'online' ? '#fff' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FiCreditCard size={20} /> دفع إلكتروني
            {method === 'online' && <FiCheck size={18} style={{ marginRight: 'auto' }} />}
          </button>
          <button onClick={() => setMethod('cod')}
            className="product-btn" style={{ background: method === 'cod' ? 'var(--gradient-primary)' : 'var(--bg-input)', color: method === 'cod' ? '#fff' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FiDollarSign size={20} /> الدفع عند الاستلام
            {method === 'cod' && <FiCheck size={18} style={{ marginRight: 'auto' }} />}
          </button>
        </div>

        {method === 'online' && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>payments@anwarflowers.com</p>
            <input type="text" className="form-input" placeholder="رقم عملية التحويل"
              value={transactionNumber} onChange={e => setTransactionNumber(e.target.value)} />
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
          <p style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '18px' }}>المبلغ المطلوب: ${costs.total}</p>
        </div>

        <button className="checkout-btn" onClick={handleConfirm} disabled={loading}
          style={{ background: loading ? 'var(--text-tertiary)' : 'var(--success)' }}>
          {loading ? '⏳ جاري...' : '✅ تأكيد الطلب'}
        </button>
      </div>
    </div>
  );
}