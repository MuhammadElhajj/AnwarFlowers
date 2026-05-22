import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { storage } from '../../services/storage';
import { FiStar, FiCheck } from 'react-icons/fi';

export default function StarRating({ rating, totalRatings, distribution, onRate }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (user) {
      const ratings = storage.get('ratings', []);
      const userRating = ratings.find(r => r.userId === user.id || r.email === user.email);
      if (userRating) {
        setHasRated(true);
        setSelected(userRating.rating);
      }
    }
  }, [user]);

  const handleRate = (star) => {
    if (hasRated) return;
    
    setSelected(star);
    setHasRated(true);
    
    const ratings = storage.get('ratings', []);
    ratings.push({
      id: Date.now(),
      rating: star,
      userId: user?.id,
      email: user?.email,
      user: user?.firstName || t('guest'),
      date: new Date().toISOString()
    });
    storage.set('ratings', ratings);
    
    setShowThankYou(true);
    setTimeout(() => setShowThankYou(false), 2500);
    
    onRate?.(star);
  };

  const dist = distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const maxDist = Math.max(...Object.values(dist), 1);

  const isStarActive = (star) => {
    if (hovered !== null) return star <= hovered;
    if (selected !== null) return star <= selected;
    return false;
  };

  const displayStars = () => {
    const stars = [];
    const fullStars = Math.floor(Number(rating));
    const hasHalf = Number(rating) - fullStars >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FiStar key={i} className="rating-star-icon" fill="#fbbf24" size={22} />);
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(<FiStar key={i} className="rating-star-icon" fill="#fbbf24" size={22} />);
      } else {
        stars.push(<FiStar key={i} className="rating-star-icon empty" size={22} />);
      }
    }
    return stars;
  };

  return (
    <div className="rating-wrapper">
      {showThankYou && (
        <div className="thank-you-overlay" onClick={() => setShowThankYou(false)}>
          <div className="thank-you-content">
            <div className="thank-you-emoji">🎉</div>
            <p className="thank-you-text">{t('thankYouForRating')}</p>
          </div>
        </div>
      )}

      {/* الأجزاء المعلقة (التوزيع والعرض العام) اختيارية، يمكن تفعيلها إذا أردت */}

      <div className="rate-section">
        {hasRated ? (
          <div className="already-rated-message">
            <FiCheck size={18} />
            {t('alreadyRated')}
          </div>
        ) : (
          <>
            <h4 className="rate-section-title">
              <FiStar size={16} color="#f59e0b" /> {t('rateStore')}
            </h4>
            <div className="rate-stars-container">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`rate-star-btn ${isStarActive(star) ? 'active' : ''}`}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleRate(star)}
                  title={`${star} ${t('stars')}`}
                  aria-label={`${star} ${t('stars')}`}
                >
                  <FiStar size={22} fill={isStarActive(star) ? '#fff' : 'none'} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}