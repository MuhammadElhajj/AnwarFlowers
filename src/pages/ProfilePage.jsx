import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import { FiCamera, FiSave, FiX, FiLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
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
    profileImageUrl: '' // حقل إضافي لرابط الصورة
  });

  // تحديث معاينة الصورة عند إدخال رابط
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
        toast.success('تم تحديث الصورة الشخصية');
      } catch (err) {
        toast.error(err.message || 'فشل تحميل الصورة');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const updateData = { ...form };
    
    // إذا تم إدخال رابط صورة، نرسله كمسار الصورة
    if (form.profileImageUrl && form.profileImageUrl !== (user?.profileImage || '')) {
      updateData.profileImage = form.profileImageUrl;
    }
    
    try {
      await updateProfile(updateData);
      setEditing(false);
      toast.success('تم حفظ التغييرات');
    } catch (err) {
      toast.error(err.message || 'فشل حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

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
                <div className="profile-avatar" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                  {imagePreview ? <img src={imagePreview} alt="" /> : user?.firstName?.[0]?.toUpperCase()}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} hidden />
              </div>

              <h1 className="profile-name">{user?.firstName} {user?.lastName}</h1>
              <p className="profile-email">{user?.email}</p>

              {!editing ? (
                <>
                  <div className="profile-info-grid">
                    {[
                      { label: 'الهاتف', value: user?.phone || '-' },
                      { label: 'العنوان', value: user?.address || '-' },
                      { label: 'الموقع', value: user?.location || '-' },
                      { label: 'تاريخ التسجيل', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '-' }
                    ].map((item, i) => (
                      <div key={i} className="profile-info-item">
                        <p className="profile-info-label">{item.label}</p>
                        <p className="profile-info-value">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <button className="product-btn" onClick={() => setEditing(true)}>✏️ تعديل</button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">الاسم الأول</label>
                      <input className="form-input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">الاسم الأخير</label>
                      <input className="form-input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                    </div>
                  </div>
                  
                  {/* حقل رابط الصورة (من Google أو أي رابط) */}
                  <div className="form-group">
                    <label className="form-label">
                      <FiLink style={{ marginRight: '6px' }} /> رابط الصورة (Google/URL)
                    </label>
                    <input 
                      className="form-input" 
                      placeholder="https://... رابط صورتك"
                      value={form.profileImageUrl}
                      onChange={handleUrlChange}
                    />
                    <small style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      أدخل رابط صورة من Google أو أي رابط آخر لاستخدامها كصورة شخصية
                    </small>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">الهاتف</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">العنوان</label>
                    <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">الموقع</label>
                    <input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="product-btn" onClick={handleSave} disabled={saving}>
                      {saving ? '⏳ جاري الحفظ...' : <><FiSave /> حفظ</>}
                    </button>
                    <button className="product-btn" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                      onClick={() => setEditing(false)}><FiX /> إلغاء</button>
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