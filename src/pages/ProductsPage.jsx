import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  FiShoppingCart, FiEye, FiAlertTriangle, FiClock, FiGift, FiSearch
} from 'react-icons/fi';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import img123 from '../assets/hero.jpg'; // صورة احتياطية
import '../styles/pages/user-pages-shared.css';

// مصفوفة افتراضية (غير مستخدمة، للتوثيق)
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

  const truncateDesc = (desc, maxLength = 45) => {
    if (!desc) return '';
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength).trimEnd() + '...';
  };

  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  // ----- حالة التحميل -----
  if (isLoading) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-bg" />
        <div className="dashboard-layout">
          <div className="dashboard-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div className="empty-state">
              <div className="empty-state-icon"><FiClock size={60} /></div>
              <h2>جاري تحميل المنتجات...</h2>
              <div className="spinner" style={{ marginTop: '20px' }}>
                <span className="loader" style={{
                  width: '40px', height: '40px',
                  border: '4px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite'
                }}></span>
              </div>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
    );
  }

  // ----- حالة خطأ -----
  if (fetchError) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-bg" />
        <div className="dashboard-layout">
          <div className="dashboard-main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div className="empty-state">
              <div className="empty-state-icon"><FiAlertTriangle size={60} /></div>
              <h2>{fetchError}</h2>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>إعادة المحاولة</button>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
    );
  }

  // ----- عرض المنتجات -----
  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />
      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content">
            <div className="products-header">
              <h1 className="page-title">
                <FiGift size={28} /> {t('products')}
              </h1>
              <div className="search-wrapper" style={{ position: 'relative' }}>
                <FiSearch size={18} className="search-icon" style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  className="products-search"
                  placeholder={`${t('search')}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FiShoppingCart size={60} /></div>
                <h2>لا توجد منتجات مطابقة</h2>
              </div>
            ) : (
              <div className="products-grid">
                {filtered.map(product => (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="product-image">
                      {getImageSrc(product) ? (
                        <img
                          src={getImageSrc(product)}
                          alt={product.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
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
                        <FiGift size={64} />
                      </span>
                      <div className="product-overlay">
                        <span className="overlay-icon"><FiEye size={32} /></span>
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
                        <FiShoppingCart size={18} style={{ marginRight: '6px' }} />
                        {t('addToCart')}
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
}