import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import Header from '../components/Layout/Header';
import img123 from '../assets/hero.jpg'; // صورة افتراضية

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

  // دالة لمعرفة مصدر الصورة (URL / Base64 / نص)
  const getImageSrc = () => {
    if (!product?.image) return null;
    if (
      product.image.startsWith('http') ||
      product.image.startsWith('/') ||
      product.image.startsWith('data:')  // ✅ يدعم Base64
    ) {
      return product.image;
    }
    return null; // إيموجي أو نص
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-bg" />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#fff' }}>
          <span className="loader" style={{ width: '48px', height: '48px', border: '5px solid #fff', borderBottomColor: '#ff69b4', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-bg" />
        <div style={{ textAlign: 'center', color: '#fff', padding: '4rem' }}>
          <h2>{error}</h2>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>العودة للمنتجات</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />
      <div className="product-detail-container" style={{ maxWidth: '900px', margin: '2rem auto', padding: '1rem', color: '#fff' }}>
        <Link to="/products" className="btn btn-secondary" style={{ marginBottom: '1rem' }}>← العودة للمنتجات</Link>
        <div className="product-detail-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '2rem' }}>
          <div className="product-detail-image" style={{ flex: '1 1 300px', textAlign: 'center' }}>
            {/* ✅ عرض الصورة أو الإيموجي أو الصورة الافتراضية */}
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
            {/* fallback: إيموجي أو الصورة الافتراضية */}
            <div style={{ display: getImageSrc() ? 'none' : 'block', fontSize: '100px' }}>
              {product.image || <img src={img123} alt="default" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px' }} />}
            </div>
          </div>
          <div className="product-detail-info" style={{ flex: '1 1 300px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{product.name}</h1>
            {product.description && <p style={{ color: '#ccc', marginBottom: '1rem' }}>{product.description}</p>}
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff69b4' }}>${product.price}</p>
            <button
              className="btn btn-primary"
              onClick={() => addToCart(product)}
              style={{ marginTop: '1rem', padding: '12px 24px', fontSize: '1.1rem' }}
            >
              🛒 {t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}