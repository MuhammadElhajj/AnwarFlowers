import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import img123 from '../assets/hero.jpg'; // صورة احتياطية

// مصفوفة افتراضية للتوثيق فقط
const defaultProducts = [
  { id: 1, name: 'بوكيه ورد أحمر', price: 49.99, image: '🌹', description: '24 وردة حمراء طبيعية مع تغليف فاخر' },
  { id: 2, name: 'بوكيه تيوليب', price: 39.99, image: '🌷', description: 'تيوليب هولندي ملون مع أوراق خضراء' },
  { id: 3, name: 'أوركيد أبيض', price: 59.99, image: '🌸', description: 'نبتة أوركيد طبيعية في أصيص سيراميك' },
  { id: 4, name: 'بوكيه منوع', price: 44.99, image: '💐', description: 'مجموعة متنوعة من الورود الموسمية' },
  { id: 5, name: 'مجموعة هدايا', price: 79.99, image: '🎁', description: 'بوكيه + شوكولاتة + دبدوب' },
  { id: 6, name: 'عباد الشمس', price: 34.99, image: '🌻', description: 'بوكيه عباد الشمس المشرق' },
];

export default function ProductsPage() {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const productsList = productsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsList);
      } catch (err) {
        console.error('فشل جلب المنتجات من Firestore:', err);
        setFetchError('تعذر تحميل المنتجات، يرجى المحاولة لاحقاً.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // دالة التحقق من صيغة الصورة (URL, Base64, إيموجي)
  const getImageSrc = (product) => {
    const img = product.image;
    if (!img) return null;
    if (
      img.startsWith('http') ||
      img.startsWith('/') ||
      img.startsWith('data:')
    ) {
      return img;
    }
    return null;
  };

  // اقتطاع الوصف
  const truncateDesc = (desc, maxLength = 45) => {
    if (!desc) return '';
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength).trimEnd() + '...';
  };

  // فلترة المنتجات بالاسم أو الوصف (حقل description)
  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  // --- حالات التحميل وخطأ ---
  if (isLoading) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-bg" />
        <div className="dashboard-layout">
          <div className="dashboard-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div className="loading-spinner">
              <span className="loader" style={{
                width: '48px', height: '48px',
                border: '5px solid #FFF', borderBottomColor: '#FF69B4',
                borderRadius: '50%', display: 'inline-block',
                animation: 'rotation 1s linear infinite'
              }}></span>
              <p style={{ marginTop: '1rem', color: '#fff', fontSize: '1.2rem' }}>جاري تحميل المنتجات...</p>
            </div>
          </div>
          <Sidebar />
        </div>
        <style>{`@keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-bg" />
        <div className="dashboard-layout">
          <div className="dashboard-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div className="error-message" style={{ color: '#fff', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem' }}>😢</p>
              <p>{fetchError}</p>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
    );
  }

  // --- عرض المنتجات ---
  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />
      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content">
            <div className="products-header">
              <h1 className="products-title">🌸 {t('products')}</h1>
              <input
                type="text"
                className="products-search"
                placeholder={`${t('search')}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <p style={{ color: '#fff', textAlign: 'center', marginTop: '3rem' }}>لا توجد منتجات مطابقة</p>
            ) : (
              <div className="products-grid">
                {filtered.map(product => (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => navigate(`/product/${product.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-image">
                      {getImageSrc(product) ? (
                        <img
                          src={getImageSrc(product)}
                          alt={product.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : null}
                      <span
                        className="product-emoji-fallback"
                        style={{
                          display: getImageSrc(product) ? 'none' : 'flex',
                          fontSize: '80px',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        {product.image || '🌸'}
                      </span>
                      <div className="product-overlay">
                        <span className="overlay-icon">👁️</span>
                      </div>
                    </div>
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      {product.description && (
                        <p className="product-desc" title={product.description}>
                          {truncateDesc(product.description)}
                        </p>
                      )}
                      <p className="product-price">${product.price}</p>
                      <button
                        className="product-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        🛒 {t('addToCart')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
} // ← نهاية المكون، جميع الأقواس متوازنة