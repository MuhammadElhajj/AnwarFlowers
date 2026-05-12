import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Layout/Header';
import { FiArrowLeft, FiShoppingCart, FiPackage, FiAlertTriangle, FiClock } from 'react-icons/fi';
import img123 from '../assets/hero.jpg'; // صورة افتراضية
import '../styles/pages/user-pages-shared.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'products', id));
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('المنتج غير موجود');
        }
      } catch (err) {
        console.error(err);
        setError('فشل تحميل المنتج');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const getImageSrc = () => {
    if (!product?.image) return null;
    if (
      product.image.startsWith('http') ||
      product.image.startsWith('/') ||
      product.image.startsWith('data:')
    ) {
      return product.image;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-bg" />
        <div className="dashboard-layout">
          <div className="dashboard-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div className="empty-state">
              <div className="empty-state-icon"><FiClock size={60} /></div>
              <h2>جاري تحميل المنتج...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-bg" />
        <div className="dashboard-layout">
          <div className="dashboard-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div className="empty-state">
              <div className="empty-state-icon"><FiAlertTriangle size={60} /></div>
              <h2>{error}</h2>
              <Link to="/products" className="btn btn-primary">العودة للمنتجات</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />
      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content">
            <Link to="/products" className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
              <FiArrowLeft /> العودة للمنتجات
            </Link>

            <div className="product-detail-card glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
              <div className="product-detail-image" style={{ flex: '1 1 300px', textAlign: 'center' }}>
                {getImageSrc() ? (
                  <img
                    src={getImageSrc()}
                    alt={product.name}
                    style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div style={{ display: getImageSrc() ? 'none' : 'block', fontSize: '80px' }}>
                  <FiPackage size={80} />
                </div>
              </div>
              <div className="product-detail-info" style={{ flex: '1 1 300px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#fff' }}>{product.name}</h1>
                {product.description && <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{product.description}</p>}
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-light)' }}>${product.price}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => addToCart(product)}
                  style={{ marginTop: '1.5rem', padding: '12px 24px', fontSize: '1.1rem' }}
                >
                  <FiShoppingCart style={{ marginRight: '8px' }} /> {t('addToCart')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}