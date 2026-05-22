import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  useCart,
  MESSAGE_COLORS,
  MESSAGE_PLACEMENTS
} from '../contexts/CartContext';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiGift, FiMessageSquare, FiDroplet } from 'react-icons/fi';
import '../styles/pages/user-pages-shared.css';

export default function CartPage() {
  const { t } = useLanguage();
  const {
    items, removeFromCart, updateQty, cartCount, calculateCost,
    customMessage, setCustomMessage,
    messageColor, setMessageColor,
    messagePlacement, setMessagePlacement,
    wrappingColor, setWrappingColor,
    selectedAddons, toggleAddon,
    addonsList
  } = useCart();
  const navigate = useNavigate();

  const costs = calculateCost();

  const isImageUrl = (str) => {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('http') || str.startsWith('data:') || str.startsWith('/');
  };

  const addons = Array.isArray(addonsList) ? addonsList : [];

  // ترجمة خيارات MESSAGE_PLACEMENTS
  const translatedPlacements = MESSAGE_PLACEMENTS.map(p => ({
    ...p,
    label: t(`messagePlacement${p.value.charAt(0).toUpperCase() + p.value.slice(1)}`) || p.label
  }));

  // ترجمة ألوان الرسائل
  const translatedColors = MESSAGE_COLORS.map(c => ({
    ...c,
    label: t(`color${c.value.charAt(0).toUpperCase() + c.value.slice(1)}`) || c.label
  }));

  if (items.length === 0) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-bg" />
        <div className="dashboard-layout">
          <div className="dashboard-main-content">
            <div className="dashboard-content">
              <div className="empty-cart empty-state">
                <div className="empty-state-icon">
                  <FiShoppingCart size={80} />
                </div>
                <h2>{t('emptyCart')}</h2>
                <button className="btn btn-primary" onClick={() => navigate('/products')}>
                  {t('browseProducts')}
                </button>
              </div>
            </div>
          </div>
          <Sidebar />
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
            <h1 className="cart-title page-title">
              <FiShoppingCart size={28} /> {t('cart')}
            </h1>

            <div className="cart-grid">
              <div className="cart-items">
                {items.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      {isImageUrl(item.image) ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span style={{
                        display: isImageUrl(item.image) ? 'none' : 'flex',
                        fontSize: '32px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                      }}>
                        <FiGift size={32} />
                      </span>
                    </div>
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.name}</h3>
                      <p className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="cart-item-qty">
                      <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)} aria-label={t('decreaseQuantity')}>
                        <FiMinus size={14} />
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)} aria-label={t('increaseQuantity')}>
                        <FiPlus size={14} />
                      </button>
                    </div>
                    <button className="cart-item-remove" onClick={() => removeFromCart(item.id)} aria-label={t('remove')}>
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}

                {items.length > 0 && (
                  <div className="customization-section">
                    <h3 className="customization-title">
                      <FiGift size={20} /> {t('addonsAndCustomization')}
                    </h3>
                    
                    <div className="addons-grid">
                      {addons.length === 0 ? (
                        <p className="no-addons-message">{t('noAddonsAvailable')}</p>
                      ) : (
                        addons.map(addon => (
                          <button
                            key={addon.id}
                            className={`addon-item ${selectedAddons.includes(addon.id) ? 'active' : ''}`}
                            onClick={() => toggleAddon(addon.id)}
                            type="button"
                            aria-label={`${t('add')} ${addon.name}`}
                          >
                            <span className="addon-icon">{addon.icon || '🎁'}</span>
                            <span className="addon-name">{addon.name}</span>
                            <span className="addon-price">+${addon.price}</span>
                            {selectedAddons.includes(addon.id) && <span className="addon-check">✓</span>}
                          </button>
                        ))
                      )}
                    </div>

                    <div className="custom-message-section">
                      <label className="custom-label">
                        <FiMessageSquare size={16} style={{ marginRight: '6px' }} />
                        {t('messageOnBouquet')}
                      </label>
                      <textarea
                        className="custom-textarea"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder={t('writeYourMessage')}
                        rows={3}
                        maxLength={200}
                      />
                      {customMessage && (
                        <div className="message-options">
                          <div className="option-group">
                            <label>{t('writingColor')}</label>
                            <div className="color-options">
                              {translatedColors.map(color => (
                                <button
                                  key={color.value}
                                  className={`color-btn ${messageColor === color.value ? 'active' : ''}`}
                                  style={{ backgroundColor: color.code }}
                                  onClick={() => setMessageColor(color.value)}
                                  title={color.label}
                                  type="button"
                                  aria-label={color.label}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="option-group">
                            <label>{t('writingPlacement')}</label>
                            <select
                              className="custom-select"
                              value={messagePlacement}
                              onChange={(e) => setMessagePlacement(e.target.value)}
                              aria-label={t('writingPlacement')}
                            >
                              {translatedPlacements.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="wrapping-color-section">
                      <label className="custom-label">
                        <FiDroplet size={16} style={{ marginRight: '6px' }} />
                        {t('wrappingPaperColor')}
                      </label>
                      <div className="color-picker-row">
                        <input
                          type="color"
                          value={wrappingColor}
                          onChange={(e) => setWrappingColor(e.target.value)}
                          className="color-picker"
                          aria-label={t('wrappingPaperColor')}
                        />
                        <span className="color-hex">{wrappingColor}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="cart-summary cost-summary">
                <h2 className="summary-title">{t('orderSummary')}</h2>
                <div className="summary-row cost-row">
                  <span>{t('products')} ({costs.itemCount})</span>
                  <span>${costs.subtotal}</span>
                </div>
                {costs.addonsCost > 0 && (
                  <div className="summary-row cost-row">
                    <span>{t('addons')}</span>
                    <span>${costs.addonsCost}</span>
                  </div>
                )}
                <div className="summary-row cost-row">
                  <span>{t('delivery')}</span>
                  <span>${costs.deliveryCost}</span>
                </div>
                <div className="summary-row cost-row">
                  <span>{t('wrapping')}</span>
                  <span>${costs.wrappingCost}</span>
                </div>
                <div className="summary-row cost-row">
                  <span>{t('tax')}</span>
                  <span>${costs.tax}</span>
                </div>
                {costs.discountAmount > 0 && (
                  <div className="summary-row cost-row" style={{ color: 'var(--success)' }}>
                    <span>🎫 {costs.discountLabel}</span>
                    <span>-${costs.discountAmount}</span>
                  </div>
                )}
                <div className="summary-total cost-row total">
                  <span>{t('total')}</span>
                  <span>${costs.total}</span>
                </div>
                <button className="checkout-btn btn btn-primary" onClick={() => navigate('/checkout')}>
                  {t('proceedToCheckout')}
                </button>
              </div>
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}