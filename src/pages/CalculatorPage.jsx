import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import { FiMinus, FiPlus, FiShoppingCart, FiX } from 'react-icons/fi';

const flowers = [
  { key: 'rose', name: 'ورد', price: 3.5, emoji: '🌹' },
  { key: 'tulip', name: 'تيوليب', price: 4, emoji: '🌷' },
  { key: 'orchid', name: 'أوركيد', price: 5.5, emoji: '🌸' },
  { key: 'sunflower', name: 'عباد', price: 2.5, emoji: '🌻' },
  { key: 'lily', name: 'ليلي', price: 4.5, emoji: '🪷' },
  { key: 'mixed', name: 'منوع', price: 3, emoji: '💐' },
];

const wrappings = [
  { key: 'basic', name: 'أساسي', price: 5, icon: '📦' },
  { key: 'premium', name: 'ممتاز', price: 12, icon: '🎁' },
  { key: 'luxury', name: 'فاخر', price: 25, icon: '💎' },
];

export default function CalculatorPage() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [flowerType, setFlowerType] = useState('rose');
  const [count, setCount] = useState(12);
  const [wrapping, setWrapping] = useState('basic');
  const [showModal, setShowModal] = useState(false);

  const flower = flowers.find(f => f.key === flowerType);
  const wrap = wrappings.find(w => w.key === wrapping);
  const flowerCost = count * flower.price;
  const wrapCost = wrap.price;
  const deliveryCost = 5;
  const tax = (flowerCost + wrapCost + deliveryCost) * 0.15;
  const total = flowerCost + wrapCost + deliveryCost + tax;
  const daysNeeded = count > 50 ? 3 : count > 20 ? 2 : 1;

  const handleAddToCart = () => {
    addToCart({
      id: Date.now(),
      name: `بوكيه ${flower.name} - ${count} وردة`,
      price: parseFloat(total.toFixed(2)),
      image: flower.emoji,
      quantity: 1
    });
    setShowModal(false);
    navigate('/cart');
  };

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />
      
      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content">
            <h1 className="calculator-title">🧮 حاسبة البوكيهات</h1>

            <div className="calculator-card">
              {/* اختيار الورد */}
              <div className="calc-section">
                <h3 className="calc-label">
                  <span className="label-icon">🌸</span> نوع الورد
                </h3>
                <div className="flower-options">
                  {flowers.map(f => (
                    <div key={f.key} className={`flower-option ${flowerType === f.key ? 'active' : ''}`}
                      onClick={() => setFlowerType(f.key)}>
                      <div className="flower-option-emoji">{f.emoji}</div>
                      <div className="flower-option-name">{f.name}</div>
                      <div className="flower-option-price">${f.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* عدد الورود */}
              <div className="calc-section">
                <h3 className="calc-label">
                  <span className="label-icon">🌺</span> عدد الورود
                </h3>
                <div className="counter-row">
                  <button className="counter-btn" onClick={() => setCount(Math.max(1, count - 1))}>
                    <FiMinus />
                  </button>
                  <div className="counter-value">{count}</div>
                  <button className="counter-btn" onClick={() => setCount(Math.min(999, count + 1))}>
                    <FiPlus />
                  </button>
                </div>
                <input type="range" min="1" max="999" value={count}
                  onChange={e => setCount(+e.target.value)}
                  style={{ width: '100%', marginTop: '12px', accentColor: 'var(--accent)' }} />
              </div>

              {/* التغليف */}
              <div className="calc-section">
                <h3 className="calc-label">
                  <span className="label-icon">🎁</span> التغليف
                </h3>
                <div className="flower-options">
                  {wrappings.map(w => (
                    <div key={w.key} className={`flower-option ${wrapping === w.key ? 'active' : ''}`}
                      onClick={() => setWrapping(w.key)}>
                      <div className="flower-option-emoji">{w.icon}</div>
                      <div className="flower-option-name">{w.name}</div>
                      <div className="flower-option-price">${w.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* زر حساب */}
              <button className="checkout-btn" onClick={() => setShowModal(true)}>
                🧮 حساب التكلفة
              </button>
            </div>
          </div>
        </div>

        <Sidebar />
      </div>

      {/* ========== نافذة النتيجة المنبثقة ========== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">💰 تفاصيل التكلفة</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="result-box" style={{ marginTop: 0, border: 'none', padding: 'var(--space-4)' }}>
              <div className="result-row">
                <span>{flower.emoji} تكلفة {count} وردة</span>
                <span>${flowerCost.toFixed(2)}</span>
              </div>
              <div className="result-row">
                <span>🎁 التغليف</span>
                <span>${wrapCost.toFixed(2)}</span>
              </div>
              <div className="result-row">
                <span>🚚 التوصيل</span>
                <span>${deliveryCost.toFixed(2)}</span>
              </div>
              <div className="result-row">
                <span>💰 الضريبة</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="result-row total">
                <span>المجموع الكلي</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '12px', fontSize: '0.9rem' }}>
                ⏱️ وقت التجهيز: {daysNeeded} {daysNeeded === 1 ? 'يوم' : 'أيام'}
              </p>
            </div>

            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <FiShoppingCart /> أضف إلى السلة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}