import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Layout/Header';
import { FiArrowLeft, FiShoppingCart, FiPackage, FiAlertTriangle, FiClock } from 'react-icons/fi';
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
          setError(t('productNotFound'));
        }
      } catch (err) {
        console.error(err);
        setError(t('failedToLoadProduct'));
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, t]);

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
              <h2>{t('loadingProduct')}</h2>
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
              <Link to="/products" className="btn btn-primary">{t('backToProducts')}</Link>
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
            <Link to="/products" className="btn btn-secondary product-detail-back-btn">
              <FiArrowLeft /> {t('backToProducts')}
            </Link>

            <div className="product-detail-card glass-card">
              <div className="product-detail-image">
                {getImageSrc() ? (
                  <img
                    src={getImageSrc()}
                    alt={product.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div className="product-detail-fallback" style={{ display: getImageSrc() ? 'none' : 'block' }}>
                  <FiPackage size={80} />
                </div>
              </div>
              <div className="product-detail-info">
                <h1 className="product-detail-name">{product.name}</h1>
                {product.description && <p className="product-detail-description">{product.description}</p>}
                <p className="product-detail-price">${product.price}</p>
                <button className="btn btn-primary add-to-cart-btn" onClick={() => addToCart(product)}>
                  <FiShoppingCart /> {t('addToCart')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}