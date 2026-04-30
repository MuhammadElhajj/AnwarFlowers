import { useState, useEffect } from 'react';
import AdminSidebar from '../components/Admin/AdminSidebar';
import AdminHeader from '../components/Admin/AdminHeader'; // ✅ الهيدر الجديد
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [shopName, setShopName] = useState('متجر بوكيهات أنور');
  const [taxRate, setTaxRate] = useState(15);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);

  // جلب الإعدادات من Firestore عند تحميل الصفحة
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'shop');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setShopName(data.shopName || 'متجر بوكيهات أنور');
          setTaxRate(data.taxRate || 15);
          setCurrency(data.currency || 'USD');
        }
        // إذا لم توجد وثيقة، نستخدم القيم الافتراضية
      } catch (err) {
        console.error('فشل جلب الإعدادات:', err);
        // نحتفظ بالقيم الافتراضية
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // حفظ في Firestore
      await setDoc(doc(db, 'settings', 'shop'), {
        shopName,
        taxRate,
        currency,
        updatedAt: new Date().toISOString()
      });
      // حفظ في localStorage كنسخة احتياطية
      localStorage.setItem('shopSettings', JSON.stringify({ shopName, taxRate, currency }));
      toast.success('تم حفظ الإعدادات');
    } catch (err) {
      toast.error(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader />  {/* ✅ الهيدر هنا */}

        <h1 style={{ marginBottom: '24px' }}>⚙️ الإعدادات</h1>
        <div className="card card-padded">
          <div className="form-group">
            <label className="form-label">اسم المتجر</label>
            <input className="form-input" value={shopName} onChange={e => setShopName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">الضريبة (%)</label>
            <input className="form-input" type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">العملة</label>
            <select className="form-input" value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="USD">USD ($)</option>
              <option value="SAR">SAR (﷼)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? '⏳ جاري الحفظ...' : '💾 حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}