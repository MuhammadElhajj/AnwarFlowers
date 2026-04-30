import { useState, useEffect, useRef } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSmile, FiAlertTriangle } from 'react-icons/fi';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

const EMOJI_SUGGESTIONS = ['✨', '🌿', '👑', '🧸', '🎀', '💎', '🎈', '💌', '🕊️', '🌟', '🎁', '💐', '🍫', '🎂', '🦋', '💖', '⭐', '🔥', '🌸', '🎉'];

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', icon: '' });
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // ✅ حالة نافذة تأكيد الحذف
  const emojiPickerRef = useRef(null);

  const fetchAddons = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'addons'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAddons(list);
    } catch (err) {
      toast.error('فشل جلب الإضافات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', price: '', icon: '' });
    setShowEmojiPicker(false);
    setShowModal(true);
  };

  const openEdit = (addon) => {
    setEditing(addon);
    setForm({ name: addon.name, price: addon.price.toString(), icon: addon.icon || '' });
    setShowEmojiPicker(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: form.name,
      price: parseFloat(form.price),
      icon: form.icon || '🎁'
    };
    try {
      if (editing) {
        await updateDoc(doc(db, 'addons', editing.id), data);
        setAddons(prev => prev.map(a => a.id === editing.id ? { id: editing.id, ...data } : a));
      } else {
        const docRef = await addDoc(collection(db, 'addons'), data);
        setAddons(prev => [...prev, { id: docRef.id, ...data }]);
      }
      setShowModal(false);
      toast.success(editing ? 'تم التحديث' : 'تمت الإضافة');
    } catch (err) {
      toast.error('فشل حفظ الإضافة');
    }
  };

  // ✅ فتح نافذة تأكيد الحذف
  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
  };

  // ✅ تأكيد الحذف بعد النافذة
  const confirmDelete = async () => {
    if (confirmDeleteId) {
      await deleteDoc(doc(db, 'addons', confirmDeleteId));
      setAddons(prev => prev.filter(a => a.id !== confirmDeleteId));
      toast.success('تم الحذف');
      setConfirmDeleteId(null);
    }
  };

  const insertEmoji = (emoji) => {
    setForm(prev => ({ ...prev, icon: prev.icon + emoji }));
    setShowEmojiPicker(false);
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main">
          <AdminHeader />
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <span className="loader" style={{ width: 48, height: 48, border: '5px solid rgba(255,255,255,0.2)', borderBottomColor: '#ff69b4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />

        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <h1>🏷️ الإضافات</h1>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><FiPlus /> إضافة جديدة</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الأيقونة</th>
                <th>الاسم</th>
                <th>السعر ($)</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {addons.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                    لا توجد إضافات بعد
                  </td>
                </tr>
              ) : (
                addons.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontSize: '1.8rem', textAlign: 'center' }}>{a.icon || '🎁'}</td>
                    <td style={{ fontWeight: '600' }}>{a.name}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: '600' }}>${a.price}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => openEdit(a)} style={{ marginRight: '8px' }}>
                        <FiEdit2 />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(a.id)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* نافذة إضافة/تعديل */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editing ? 'تعديل' : 'إضافة'} إضافة</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">الاسم</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">السعر ($)</label>
                  <input className="form-input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">الأيقونة (إيموجي)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      className="form-input"
                      value={form.icon}
                      onChange={e => setForm({...form, icon: e.target.value})}
                      placeholder="مثال: 🧸"
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="اختيار إيموجي">
                      <FiSmile size={18} />
                    </button>
                  </div>
                  {form.icon && (
                    <div style={{ marginTop: '8px', fontSize: '2rem', textAlign: 'center' }}>{form.icon}</div>
                  )}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        zIndex: 10,
                        background: 'rgba(30,30,50,0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        padding: '10px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: '6px',
                        marginTop: '6px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                      }}
                    >
                      {EMOJI_SUGGESTIONS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}>
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
              <p className="confirm-text">هل أنت متأكد من رغبتك في حذف هذه الإضافة؟</p>
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