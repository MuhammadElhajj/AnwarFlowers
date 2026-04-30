import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, getDoc
} from 'firebase/firestore';  // ← أضفنا getDoc هنا فقط
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const AdminContext = createContext(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // تحميل البيانات من Firestore عند بدء التشغيل
  useEffect(() => {
    const loadAdminData = async () => {
      // لا تحمل شيئًا إذا لم يكن هناك مستخدم مسجل كمدير
      if (!user || user.role !== 'admin') {
        setLoading(false);
        return;
      }

      setAdmin(user);
      setLoading(true);
      try {
        // جلب المنتجات
        const productsSnap = await getDocs(collection(db, 'products'));
        const productsList = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsList);

        // جلب الطلبات مرتبة حسب التاريخ
        const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const ordersSnap = await getDocs(ordersQuery);
        const ordersList = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersList);

        // جلب المستخدمين
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (err) {
        console.error('فشل تحميل بيانات المدير:', err);
        toast.error('تعذر تحميل بعض البيانات');
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [user]);

  // دوال إدارة المنتجات
  const addProduct = async (product) => {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
        isActive: true
      });
      const newProduct = { id: docRef.id, ...product };
      setProducts(prev => [...prev, newProduct]);
      toast.success('تمت الإضافة');
    } catch (err) {
      toast.error(err.message || 'فشل إضافة المنتج');
    }
  };

  const updateProduct = async (id, data) => {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, data);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      toast.success('تم التحديث');
    } catch (err) {
      toast.error(err.message || 'فشل تحديث المنتج');
    }
  };

  const deleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('تم الحذف');
    } catch (err) {
      toast.error(err.message || 'فشل حذف المنتج');
    }
  };

  // إدارة الطلبات
  const updateOrderStatus = async (orderId, status) => {
    try {
      const statusMap = {
        pending: 'قيد التجهيز',
        confirmed: 'تم التأكيد',
        shipped: 'تم الشحن',
        delivered: 'تم التوصيل',
        cancelled: 'ملغي'
      };
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status, statusText: statusMap[status] || status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, statusText: statusMap[status] } : o));

      // ✅ إنشاء إشعار للمستخدم صاحب الطلب
      try {
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (orderData.userId) {
            const shortId = orderId.slice(0, 8);
            await addDoc(collection(db, 'notifications'), {
              userId: orderData.userId,
              message: `📋 طلبك #${shortId} أصبح "${statusMap[status] || status}"`,
              orderId: orderId,
              read: false,
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (notifErr) {
        console.warn('فشل إنشاء الإشعار، لكن الطلب تم تحديثه:', notifErr);
      }

      toast.success('تم تحديث حالة الطلب');
    } catch (err) {
      toast.error(err.message || 'فشل تحديث الطلب');
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('تم الحذف');
    } catch (err) {
      toast.error(err.message || 'فشل حذف الطلب');
    }
  };

  // إدارة المستخدمين
  const toggleUserBlock = async (userId, blocked) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { blocked: !blocked });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked: !blocked } : u));
    } catch (err) {
      toast.error(err.message || 'فشل تعديل حالة المستخدم');
    }
  };

  const deleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('تم الحذف');
    } catch (err) {
      toast.error(err.message || 'فشل حذف المستخدم');
    }
  };

  // الإحصائيات (تعتمد على الحالة المحلية)
  const getStats = () => ({
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + parseFloat(o.total || 0), 0)
      .toFixed(2),
    totalUsers: users.length,
    totalProducts: products.length,
    recentOrders: orders.slice(0, 5)
  });

  return (
    <AdminContext.Provider
      value={{
        admin,
        adminLogin: null,
        adminLogout: null,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        orders,
        updateOrderStatus,
        deleteOrder,
        users,
        toggleUserBlock,
        deleteUser,
        getStats,
        loading
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}