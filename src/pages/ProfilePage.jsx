import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import { FiCamera, FiSave, FiX, FiLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    location: user?.location || '',
    profileImageUrl: ''
  });

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setForm(prev => ({ ...prev, profileImageUrl: url }));
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(user?.profileImage || null);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setImagePreview(base64);
      try {
        await updateProfile({ profileImage: base64 });
        toast.success(t('profileImageUpdated'));
      } catch (err) {
        toast.error(err.message || t('imageUploadFailed'));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const updateData = { ...form };
    
    if (form.profileImageUrl && form.profileImageUrl !== (user?.profileImage || '')) {
      updateData.profileImage = form.profileImageUrl;
    }
    
    try {
      await updateProfile(updateData);
      setEditing(false);
      toast.success(t('profileUpdated'));
    } catch (err) {
      toast.error(err.message || t('profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const formatRegistrationDate = (date) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('ar-SA');
    } catch {
      return '-';
    }
  };

  const infoFields = [
    { label: t('phone'), value: user?.phone || '-' },
    { label: t('address'), value: user?.address || '-' },
    { label: t('location'), value: user?.location || '-' },
    { label: t('registrationDate'), value: formatRegistrationDate(user?.createdAt) }
  ];

  return (
    <div className="dashboard-page">
      <Header />
      <div className="dashboard-bg" />
      
      <div className="dashboard-layout">
        <div className="dashboard-main-content">
          <div className="dashboard-content">
            <div className="profile-cover" />
            <div className="profile-card">
              <div className="profile-avatar-section">
                <div 
                  className="profile-avatar" 
                  onClick={() => fileInputRef.current?.click()} 
                  style={{ cursor: 'pointer' }}
                  aria-label={t('profileImageUpdated')}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt={t('profileImageUpdated')} />
                  ) : (
                    user?.firstName?.[0]?.toUpperCase()
                  )}
                </div>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImage} 
                  hidden 
                />
              </div>

              <h1 className="profile-name">{user?.firstName} {user?.lastName}</h1>
              <p className="profile-email">{user?.email}</p>

              {!editing ? (
                <>
                  <div className="profile-info-grid">
                    {infoFields.map((item, i) => (
                      <div key={i} className="profile-info-item">
                        <p className="profile-info-label">{item.label}</p>
                        <p className="profile-info-value">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <button className="product-btn" onClick={() => setEditing(true)}>
                    ✏️ {t('edit')}
                  </button>
                </>
              ) : (
                <div className="profile-edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{t('firstNameLabel')}</label>
                      <input 
                        className="form-input" 
                        value={form.firstName} 
                        onChange={e => setForm({...form, firstName: e.target.value})} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('lastNameLabel')}</label>
                      <input 
                        className="form-input" 
                        value={form.lastName} 
                        onChange={e => setForm({...form, lastName: e.target.value})} 
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <FiLink style={{ marginRight: '6px' }} /> {t('imageUrlLabel')}
                    </label>
                    <input 
                      className="form-input" 
                      placeholder={t('imageUrlPlaceholder')}
                      value={form.profileImageUrl}
                      onChange={handleUrlChange}
                    />
                    <small className="form-hint">{t('imageUrlHint')}</small>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{t('phone')}</label>
                    <input 
                      className="form-input" 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('address')}</label>
                    <input 
                      className="form-input" 
                      value={form.address} 
                      onChange={e => setForm({...form, address: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('location')}</label>
                    <input 
                      className="form-input" 
                      value={form.location} 
                      onChange={e => setForm({...form, location: e.target.value})} 
                    />
                  </div>
                  <div className="profile-edit-actions">
                    <button className="product-btn" onClick={handleSave} disabled={saving}>
                      {saving ? t('saving') : <><FiSave /> {t('save')}</>}
                    </button>
                    <button 
                      className="product-btn cancel-btn" 
                      onClick={() => setEditing(false)}
                    >
                      <FiX /> {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}