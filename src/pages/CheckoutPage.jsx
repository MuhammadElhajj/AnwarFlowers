import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
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
  const navigate = useNavigate();
  const costs = calculateCost();
  const [method, setMethod] = useState('online');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // إذا كانت السلة فارغة، ارجع إلى السلة
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleConfirm = async () => {
    if (method === 'online' && !transactionNumber.trim()) {
      toast.error('أدخل رقم عملية التحويل');
      return;
    }
    setLoading(true);
    const order = await placeOrder(
      method === 'online' ? 'دفع إلكتروني' : 'الدفع عند الاستلام',
      transactionNumber.trim()
    );
    setLoading(false);
    if (order) {
      toast.success('🎉 تم تأكيد الطلب بنجاح!');
      navigate('/my-orders');
    }
  };

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />

      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
            
            {/* زر العودة للسلة */}
            <button
              onClick={() => navigate('/cart')}
              style={{
                background: 'none', border: 'none', color: '#fff',
                fontSize: '1rem', display: 'flex', alignItems: 'center',
                gap: '0.5rem', cursor: 'pointer', marginBottom: '2rem',
                opacity: 0.8, transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
            >
              <FiArrowLeft size={20} /> العودة إلى السلة
            </button>

            <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiCreditCard size={28} /> إتمام الشراء
            </h1>

            {/* تخطيط شبكي: ملخص الطلب | طريقة الدفع */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              
              {/* ← ملخص الطلب */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px',
                padding: '2rem', color: '#fff'
              }}>
                <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiFileText size={20} /> ملخص الطلب
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiPackage size={14} /> المنتجات ({costs.itemCount})
                    </span>
                    <span>${costs.subtotal}</span>
                  </div>
                  {costs.addonsCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiStar size={14} /> الإضافات
                      </span>
                      <span>${costs.addonsCost}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiTruck size={14} /> التوصيل
                    </span>
                    <span>${costs.deliveryCost}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiGift size={14} /> التغليف
                    </span>
                    <span>${costs.wrappingCost}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiPercent size={14} /> الضريبة
                    </span>
                    <span>${costs.tax}</span>
                  </div>
                  {costs.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                      <span>{costs.discountLabel}</span>
                      <span>-${costs.discountAmount}</span>
                    </div>
                  )}
                  <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiDollarSign size={18} /> الإجمالي
                    </span>
                    <span style={{ color: '#ff69b4' }}>${costs.total}</span>
                  </div>
                </div>
              </div>

              {/* ← طريقة الدفع */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px',
                padding: '2rem', color: '#fff'
              }}>
                <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiCreditCard size={20} /> طريقة الدفع
                </h3>

                {/* اختيار طريقة الدفع */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: method === 'online' ? '1.5rem' : '0' }}>
                  <button
                    onClick={() => setMethod('online')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '14px 18px', borderRadius: '14px',
                      border: method === 'online' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      background: method === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                      color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <FiCreditCard size={20} color={method === 'online' ? '#10b981' : '#94a3b8'} />
                    <span style={{ flex: 1, textAlign: 'left' }}>دفع إلكتروني</span>
                    {method === 'online' && <FiCheck size={18} color="#10b981" />}
                  </button>

                  <button
                    onClick={() => setMethod('cod')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '14px 18px', borderRadius: '14px',
                      border: method === 'cod' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      background: method === 'cod' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                      color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <FiDollarSign size={20} color={method === 'cod' ? '#10b981' : '#94a3b8'} />
                    <span style={{ flex: 1, textAlign: 'left' }}>الدفع عند الاستلام</span>
                    {method === 'cod' && <FiCheck size={18} color="#10b981" />}
                  </button>
                </div>

                {/* حقل رقم التحويل (يظهر عند الدفع الإلكتروني فقط) */}
                {method === 'online' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>
                      يرجى إدخال رقم عملية التحويل
                    </p>
                    <input
                      type="text"
                      value={transactionNumber}
                      onChange={(e) => setTransactionNumber(e.target.value)}
                      placeholder="رقم عملية التحويل"
                      style={{
                        width: '100%', padding: '0.8rem 1rem',
                        borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.07)', color: '#fff',
                        fontSize: '0.95rem', outline: 'none'
                      }}
                    />
                  </div>
                )}

                {/* زر تأكيد الطلب */}
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '1rem',
                    background: loading ? '#4b5563' : 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', borderRadius: '14px', color: '#fff',
                    fontSize: '1.05rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(16,185,129,0.3)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {loading ? (
                    <>⏳ جاري تأكيد الطلب...</>
                  ) : (
                    <><FiCheck size={20} /> تأكيد الطلب والدفع</>
                  )}
                </button>

                {/* أمان */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <FiShield size={14} /> دفع آمن ومضمون
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