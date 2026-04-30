import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import PaymentModal from '../components/Cart/PaymentModal';

export default function CheckoutPage() {
  const { items, calculateCost } = useCart();
  const navigate = useNavigate();
  const costs = calculateCost();
  const [isProcessing, setIsProcessing] = useState(false);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />
      
      <div className="dashboard-layout">
        {/* Main Content */}
        <div className="dashboard-main-content">
          <div className="dashboard-content">
            <h1 className="cart-title">💳 إتمام الشراء</h1>
            <PaymentModal 
              total={costs.total} 
              onClose={() => navigate('/cart')}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>
    </div>
  );
}