import { useAdmin } from '../contexts/AdminContext';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminHeader from '../components/Admin/AdminHeader';
import { FiTrash2 } from 'react-icons/fi';

export default function AdminUsersPage() {
  const { users, toggleUserBlock, deleteUser } = useAdmin();

  const getUserName = (u) => {
    if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
    if (u.displayName) return u.displayName;
    return 'مستخدم';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '24px', color: '#fff' }}>👥 المستخدمين</h1>
          <div className="table-container" style={{ overflowX: 'auto', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table style={{ width: '100%', minWidth: '650px', color: '#fff', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>المستخدم</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>البريد</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>التاريخ</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>الحالة</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                      لا يوجد مستخدمون بعد
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{getUserName(u)}</td>
                      <td style={{ padding: '12px', fontSize: '0.9rem' }}>{u.email}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>{formatDate(u.createdAt)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: u.blocked ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                          color: u.blocked ? '#ef4444' : '#10b981',
                          whiteSpace: 'nowrap'
                        }}>
                          {u.blocked ? 'محظور' : 'نشط'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                        <button
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            background: u.blocked ? 'rgba(16,185,129,0.8)' : 'rgba(245,158,11,0.8)',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                          onClick={() => toggleUserBlock(u.id, !u.blocked)}
                        >
                          {u.blocked ? 'تفعيل' : 'حظر'}
                        </button>
                        <button
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(239,68,68,0.8)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                              deleteUser(u.id);
                            }
                          }}
                        >
                          <FiTrash2 size={14} /> حذف
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}