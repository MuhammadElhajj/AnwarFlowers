import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../services/storage';
import { FiStar, FiCheck } from 'react-icons/fi';

export default function StarRating({ rating, totalRatings, distribution, onRate }) {
  const { user } = useAuth();
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // التحقق من تقييم المستخدم السابق
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
    
    // حفظ التقييم مع معرف المستخدم
    const ratings = storage.get('ratings', []);
    ratings.push({
      id: Date.now(),
      rating: star,
      userId: user?.id,
      email: user?.email,
      user: user?.firstName || 'مستخدم',
      date: new Date().toISOString()
    });
    storage.set('ratings', ratings);
    
    // إظهار رسالة الشكر
    setShowThankYou(true);
    setTimeout(() => setShowThankYou(false), 2500);
    
    // تحديث البيانات
    onRate?.(star);
  };

  const dist = distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const maxDist = Math.max(...Object.values(dist), 1);

  const isStarActive = (star) => {
    if (hovered !== null) return star <= hovered;
    if (selected !== null) return star <= selected;
    return false;
  };

  // توليد نجوم العرض
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
      {/* Thank You Overlay */}
      {showThankYou && (
        <div className="thank-you-overlay" onClick={() => setShowThankYou(false)}>
          <div className="thank-you-content">
            <div className="thank-you-emoji">🎉</div>
            <p className="thank-you-text">شكراً لتقييمك!</p>
          </div>
        </div>
      )}

      {/* Overall Rating */}
      {/* <div className="rating-overall-display">
        <div className="rating-big-number">{rating}</div>
        <div className="rating-stars-display">{displayStars()}</div>
        <p className="rating-total-text">من 5 نجوم - {totalRatings} تقييم</p>
      </div> */}

      {/* Distribution */}
      {/* <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map(star => (
          <div key={star} className="rating-row-item">
            <span className="rating-star-label">
              {star} <FiStar size={12} fill="#f59e0b" />
            </span>
            <div className="rating-progress-bg">
              <div
                className="rating-progress-fill"
                style={{ width: `${(dist[star] / maxDist) * 100}%` }}
              />
            </div>
            <span className="rating-count-number">{dist[star]}</span>
          </div>
        ))}
      </div> */}

      {/* Rate Section */}
      <div className="rate-section">
        {hasRated ? (
          <div className="already-rated-message">
            <FiCheck size={18} />
            تم تقييمك - شكراً لك! ⭐
          </div>
        ) : (
          <>
            <h4 className="rate-section-title">
              <FiStar size={16} color="#f59e0b" /> قيّم المتجر
            </h4>
            <div className="rate-stars-container">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`rate-star-btn ${isStarActive(star) ? 'active' : ''}`}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleRate(star)}
                  title={`${star} نجوم`}
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