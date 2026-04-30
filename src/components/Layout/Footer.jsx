import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiSend, FiPhone, FiMail, FiMapPin, FiArrowUp, FiExternalLink } from 'react-icons/fi';
import { FaTelegramPlane, FaWhatsapp, FaInstagram, FaFacebook, FaTiktok } from 'react-icons/fa';
import { SiX } from 'react-icons/si';
import toast from 'react-hot-toast';

export default function Footer() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('تم الاشتراك في النشرة البريدية! 🌸');
      setEmail('');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { 
      icon: <FaTelegramPlane size={18} />, 
      url: 'https://t.me/anwarflowers', 
      className: 'social-telegram',
      label: 'Telegram' 
    },
    { 
      icon: <FaWhatsapp size={18} />, 
      url: 'https://wa.me/1234567890', 
      className: 'social-whatsapp',
      label: 'WhatsApp' 
    },
    { 
      icon: <FaInstagram size={18} />, 
      url: 'https://instagram.com/anwarflowers', 
      className: 'social-instagram',
      label: 'Instagram' 
    },
    { 
      icon: <FaFacebook size={18} />, 
      url: 'https://facebook.com/anwarflowers', 
      className: 'social-facebook',
      label: 'Facebook' 
    },
    { 
      icon: <SiX size={16} />, 
      url: 'https://x.com/anwarflowers', 
      className: 'social-twitter',
      label: 'X (Twitter)' 
    },
    { 
      icon: <FaTiktok size={18} />, 
      url: 'https://tiktok.com/@anwarflowers', 
      className: 'social-tiktok',
      label: 'TikTok' 
    },
  ];

  const storeLinks = [
    { label: t('products'), path: '/products' },
    { label: 'الحاسبة', path: '/calculator' },
    { label: t('cart'), path: '/cart' },
    { label: t('orders'), path: '/my-orders' },
  ];

  const supportLinks = [
    { label: t('profile'), path: '/profile' },
    { label: 'اتصل بنا', path: '/contact' },
    { label: 'الأسئلة الشائعة', path: '/faq' },
    { label: 'سياسة الخصوصية', path: '/privacy' },
  ];

  return (
    <footer className="main-footer">
      <div className="footer-inner">
        {/* Footer Grid */}
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-icon">🌸</span>
              <span className="footer-logo-text">{t('appName')}</span>
            </div>
            <p className="footer-description">
              متجر متخصص في أفخم بوكيهات الورد والهدايا المميزة. نقدم تشكيلة واسعة من الورود الطبيعية مع تغليف فاخر وتوصيل سريع لجميع المناسبات.
            </p>
            
            {/* Social */}
            <div className="footer-social">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`social-btn ${social.className}`}
                  title={social.label}
                >
                  <span>{social.icon}</span>
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="footer-newsletter">
              <input
                type="email"
                className="footer-newsletter-input"
                placeholder="بريدك الإلكتروني..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="footer-newsletter-btn">
                <FiSend size={14} style={{ marginLeft: '4px' }} />
                اشتراك
              </button>
            </form>
          </div>

          {/* Store Links */}
          <div>
            <h4 className="footer-section-title">المتجر</h4>
            <div className="footer-links">
              {storeLinks.map((link, i) => (
                <a key={i} className="footer-link" onClick={() => navigate(link.path)}>
                  <FiExternalLink size={14} /> {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="footer-section-title">الدعم</h4>
            <div className="footer-links">
              {supportLinks.map((link, i) => (
                <a key={i} className="footer-link" onClick={() => navigate(link.path)}>
                  <FiExternalLink size={14} /> {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer-section-title">تواصل معنا</h4>
            <div className="footer-links">
              <div className="footer-contact-item">
                <FiPhone className="footer-contact-icon" />
                <span>+123 456 7890</span>
              </div>
              <div className="footer-contact-item">
                <FiMail className="footer-contact-icon" />
                <span>info@anwarflowers.com</span>
              </div>
              <div className="footer-contact-item">
                <FiMapPin className="footer-contact-icon" />
                <span>الرياض، المملكة العربية السعودية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} <span>{t('appName')}</span> - جميع الحقوق محفوظة 🌸
          </p>
          <div className="footer-bottom-links">
            <span className="footer-bottom-link" onClick={() => navigate('/privacy')}>سياسة الخصوصية</span>
            <span className="footer-bottom-link" onClick={() => navigate('/terms')}>الشروط والأحكام</span>
            <span className="footer-bottom-link" onClick={scrollToTop} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiArrowUp size={12} /> العودة للأعلى
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}