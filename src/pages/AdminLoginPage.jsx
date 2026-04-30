import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const ok = await login(email, password);
      if (ok) {
        navigate('/admin/dashboard');
      } else {
        setError('بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🛡️</div>
          <h1 className="auth-title">لوحة التحكم</h1>
          <p className="auth-subtitle">تسجيل دخول المدير</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label htmlFor="admin-email" className="auth-label">البريد الإلكتروني</label>
            <input 
              id="admin-email"
              name="email"
              type="email" 
              className="auth-input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <div className="auth-input-group">
            <label htmlFor="admin-password" className="auth-label">كلمة المرور</label>
            <input 
              id="admin-password"
              name="password"
              type="password" 
              className="auth-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="auth-submit-btn" 
            disabled={loading}
          >
            {loading ? '⏳ جاري الدخول...' : 'دخول'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          admin@anwarflowers.com / admin123
        </p>
      </div>
    </div>
  );
}