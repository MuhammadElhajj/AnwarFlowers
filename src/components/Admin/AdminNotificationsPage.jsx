import { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import emailjs from '@emailjs/browser'; // ✅ استيراد EmailJS
import toast from 'react-hot-toast';
import { FiSearch, FiSend, FiUser, FiBell } from 'react-icons/fi';

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);

  // جلب المستخدمين
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          displayName: `${d.data().firstName || ''} ${d.data().lastName || ''}`,
        }));
        setUsers(list);
        setFilteredUsers(list);
      } catch (err) {
        toast.error('فشل تحميل المستخدمين');
      }
    };
    fetchUsers();
  }, []);

  // فلترة حسب البحث
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          u =>
            u.displayName.toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, users]);

  // ✅ إرسال الإشعار (مع الإيميل)
  const sendNotification = async () => {
    if (!selectedUser || !message.trim()) {
      toast.error('الرجاء اختيار مستخدم وكتابة رسالة');
      return;
    }
    setSending(true);
    try {
      // 1. إضافة الإشعار إلى Firestore
      await addDoc(collection(db, 'notifications'), {
        userId: selectedUser,
        message: message.trim(),
        orderId: '',
        read: false,
        createdAt: serverTimestamp(),
      });

      // 2. إرسال إيميل للمستخدم
      const selectedUserData = users.find(u => u.id === selectedUser);
      if (selectedUserData?.email) {
        emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_2zwpqdx',
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_g2tmiql',
          {
            to_email: selectedUserData.email,
            user_name: selectedUserData.displayName || 'مستخدم',
            message: message.trim(),
            site_name: 'Anwar Flowers'
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'cDwT_2Gu-ExzAw6js'
        ).catch(e => console.warn('فشل إرسال الإيميل', e));
      }

      toast.success('✅ تم إرسال الإشعار والإيميل بنجاح');
      setMessage('');
      setSelectedUser('');
    } catch (err) {
      toast.error('فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  // المستخدم المختار حالياً
  const selectedUserData = users.find(u => u.id === selectedUser);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />

        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.2)', padding: '0.8rem', borderRadius: '12px' }}>
              <FiBell size={24} color="#3b82f6" />
            </div>
            <div>
              <h1 style={{ color: '#fff', margin: 0 }}>📢 إرسال إشعار مخصص</h1>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>أرسل تنبيهات فورية إلى أي مستخدم</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* قائمة المستخدمين */}
            <div>
              <label style={{ color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                👤 اختر المستخدم
              </label>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  placeholder="ابحث عن مستخدم..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                />
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {filteredUsers.length === 0 ? (
                  <p style={{ padding: '1rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>لا يوجد مستخدمين</p>
                ) : (
                  filteredUsers.map(u => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        background: selectedUser === u.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                        borderLeft: selectedUser === u.id ? '4px solid #3b82f6' : '4px solid transparent',
                        transition: 'all 0.2s',
                        color: '#fff'
                      }}
                      onMouseEnter={e => {
                        if (selectedUser !== u.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }}
                      onMouseLeave={e => {
                        if (selectedUser !== u.id) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden',
                        background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {u.profileImage ? (
                          <img src={u.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <FiUser size={18} color="var(--text-tertiary)" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.displayName || 'بدون اسم'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{u.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* رسالة الإشعار */}
            <div>
              <label style={{ color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                ✍️ نص الإشعار
              </label>
              <textarea
                className="form-input"
                rows="6"
                placeholder="اكتب نص الإشعار الذي سيظهر للمستخدم..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '12px',
                  resize: 'vertical',
                  width: '100%'
                }}
              />
              
              {/* معاينة المستلم */}
              {selectedUserData && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <FiUser size={20} color="#10b981" />
                  <div>
                    <div style={{ color: '#fff', fontWeight: '600' }}>سيتم الإرسال إلى:</div>
                    <div style={{ color: '#10b981', fontSize: '0.9rem' }}>
                      {selectedUserData.displayName} ({selectedUserData.email})
                    </div>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={sendNotification}
                disabled={sending}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem',
                  fontSize: '1rem',
                  opacity: sending ? 0.7 : 1
                }}
              >
                <FiSend size={18} />
                {sending ? 'جارٍ الإرسال...' : 'إرسال الإشعار'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}