import { useState, useRef } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminHeader from '../components/Admin/AdminHeader';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiAlertTriangle, FiUpload } from 'react-icons/fi';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import toast from 'react-hot-toast';

// دالة ضغط الصورة وتحويلها إلى Blob (بدلاً من Base64)
const compressImageToBlob = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
  });
};

export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', image: '', description: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة كبير جداً. الحد الأقصى 5 ميغابايت.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      // ضغط الصورة وتحويلها إلى Blob
      const compressedBlob = await compressImageToBlob(file, 800, 0.7);
      
      // إنشاء اسم فريد للملف
      const fileName = `products/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const imageRef = ref(storage, fileName);
      
      // رفع إلى Firebase Storage
      await uploadBytes(imageRef, compressedBlob, { contentType: 'image/jpeg' });
      const downloadURL = await getDownloadURL(imageRef);
      
      // حفظ الرابط فقط في الحالة
      setForm({ ...form, image: downloadURL });
      toast.success('تم رفع الصورة بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل رفع الصورة، حاول مرة أخرى');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.price) {
      toast.error('الاسم والسعر مطلوبان');
      return;
    }
    
    const finalData = {
      name: form.name,
      price: parseFloat(form.price),
      description: form.description || '',
      image: form.image || '', // الآن الرابط أو فارغ
    };

    try {
      if (editing) {
        await updateProduct(editing.id, finalData);
        toast.success('تم تحديث المنتج');
      } else {
        await addProduct(finalData);
        toast.success('تم إضافة المنتج بنجاح');
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDeleteClick = (id) => setConfirmDeleteId(id);

  const confirmDelete = async () => {
    if (confirmDeleteId) {
      await deleteProduct(confirmDeleteId);
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
                        {p.image && (p.image.startsWith('http') || p.image.startsWith('https')) ? (
                          <img src={p.image} alt={p.name} loading="lazy" />
                        ) : (
                          <span className="emoji-fallback">🌸</span>
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
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(p.id)} aria-label={`حذف ${p.name}`}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal for Add/Edit */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{editing ? 'تعديل' : 'إضافة'} منتج</h2>
                <button className="modal-close" onClick={() => setShowModal(false)} aria-label="إغلاق النافذة">
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="product-name" className="form-label">الاسم</label>
                  <input
                    id="product-name"
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="product-price" className="form-label">السعر ($)</label>
                  <input
                    id="product-price"
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="product-desc" className="form-label">الوصف</label>
                  <textarea
                    id="product-desc"
                    className="form-input"
                    rows="3"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">صورة المنتج</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <FiUpload /> {uploading ? 'جاري الرفع...' : 'اختر صورة'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                    {form.image && (
                      <div className="image-preview-container">
                        <img src={form.image} alt="معاينة" />
                      </div>
                    )}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={uploading}>
                  {editing ? 'تحديث' : 'إضافة'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {confirmDeleteId && (
          <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
              <div className="confirm-icon">
                <FiAlertTriangle size={50} color="#f59e0b" />
              </div>
              <h3 className="confirm-title">تأكيد الحذف</h3>
              <p className="confirm-text">هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟</p>
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