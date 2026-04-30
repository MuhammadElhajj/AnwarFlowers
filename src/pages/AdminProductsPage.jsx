import { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminHeader from '../components/Admin/AdminHeader';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';

// دالة ضغط الصورة إلى Base64
const compressImageToBase64 = (file, maxWidth = 300, quality = 0.5) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('فشل تحميل الصورة للضغط'));
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
  });
};

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', image: '', description: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // ✅ حالة نافذة تأكيد الحذف

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', price: '', image: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm(p);
    setShowModal(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة كبير جداً. الرجاء اختيار صورة أقل من 2 ميغابايت.');
      e.target.value = '';
      return;
    }

    try {
      const base64 = await compressImageToBase64(file, 300, 0.5);
      setForm({ ...form, image: base64 });
      toast.success('تم تجهيز الصورة بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('تعذر معالجة الصورة.');
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalData = {
      name: form.name,
      price: parseFloat(form.price),
      description: form.description,
      image: form.image || '🌸',
    };

    try {
      if (editing) {
        updateProduct(editing.id, finalData);
      } else {
        addProduct(finalData);
      }
      toast.success(editing ? 'تم تحديث المنتج' : 'تم إضافة المنتج بنجاح');
      setShowModal(false);
    } catch (error) {
      console.error('فشل في حفظ المنتج:', error);
      toast.error('حدث خطأ أثناء الحفظ. الرجاء المحاولة مرة أخرى.');
    }
  };

  // ✅ فتح نافذة تأكيد الحذف
  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
  };

  // ✅ تأكيد الحذف بعد النافذة
  const confirmDelete = async () => {
    if (confirmDeleteId) {
      deleteProduct(confirmDeleteId);
      toast.success('تم حذف المنتج');
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />

        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <div>
            <h1>📦 المنتجات</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {products.length} منتج
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd} aria-label="إضافة منتج جديد">
            <FiPlus /> إضافة
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الصورة</th>
                <th>الاسم</th>
                <th>السعر</th>
                <th>الوصف</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                    لا توجد منتجات بعد
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-product-thumb">
                        {p.image && (p.image.startsWith('http') || p.image.startsWith('data:') || p.image.startsWith('/')) ? (
                          <img src={p.image} alt={p.name} />
                        ) : (
                          <span className="emoji-fallback">{p.image || '🌸'}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>{p.name}</td>
                    <td style={{ fontWeight: '600', color: 'var(--accent)' }}>${p.price}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description || '-'}
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" style={{ marginRight: '8px' }} onClick={() => openEdit(p)} aria-label={`تعديل ${p.name}`}>
                        <FiEdit2 />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteClick(p.id)}
                        aria-label={`حذف ${p.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{editing ? 'تعديل' : 'إضافة'} منتج</h2>
                <button className="modal-close" onClick={() => setShowModal(false)} aria-label="إغلاق النافذة"><FiX /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="product-name" className="form-label">الاسم</label>
                  <input id="product-name" name="name" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label htmlFor="product-price" className="form-label">السعر</label>
                  <input id="product-price" name="price" className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label htmlFor="product-desc" className="form-label">الوصف</label>
                  <input id="product-desc" name="description" className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label htmlFor="product-image" className="form-label">صورة المنتج</label>
                  <input
                    id="product-image"
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={handleImageChange}
                  />
                  {form.image && (
                    <div className="image-preview-container">
                      <img src={form.image} alt="معاينة" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '8px' }} />
                    </div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary btn-full">
                  {editing ? 'تحديث' : 'إضافة'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ✅ نافذة تأكيد الحذف المخصصة */}
        {confirmDeleteId && (
          <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
              <div className="confirm-icon">
                <FiAlertTriangle size={50} color="#f59e0b" />
              </div>
              <h3 className="confirm-title">تأكيد الحذف</h3>
              <p className="confirm-text">هل أنت متأكد من رغبتك في حذف هذا المنتج؟</p>
              <div className="confirm-actions">
                <button onClick={confirmDelete} className="btn btn-danger">نعم، احذف</button>
                <button onClick={() => setConfirmDeleteId(null)} className="btn btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}