import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from '../services/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ مراقبة حالة المستخدم من Firebase Auth (محسّنة)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          let finalUser;
          if (userDoc.exists()) {
            const userData = userDoc.data();
            finalUser = { ...firebaseUser, ...userData };
            // تخزين role في localStorage كنسخة احتياطية
            localStorage.setItem('userRole', userData.role || 'user');
          } else {
            // إنشاء وثيقة جديدة للمستخدم إذا لم تكن موجودة
            const newUserData = {
              firstName: firebaseUser.displayName?.split(' ')[0] || 'مستخدم',
              lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
              email: firebaseUser.email,
              role: 'user',
              phone: '',
              address: '',
              location: '',
              profileImage: '',
              points: 0,
              ordersCount: 0,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUserData);
            finalUser = { ...firebaseUser, ...newUserData };
            localStorage.setItem('userRole', 'user');
          }
          setUser(finalUser);
        } catch (err) {
          console.warn('فشل جلب بيانات Firestore، استخدام بيانات Auth الأساسية:', err);
          // في حالة الفشل، نستخدم localStorage كحل أخير
          const role = localStorage.getItem('userRole') || 'user';
          setUser({ ...firebaseUser, role });
        }
      } else {
        setUser(null);
        localStorage.removeItem('userRole');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ تسجيل الدخول بحساب Google (محسّن)
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          firstName: result.user.displayName?.split(' ')[0] || '',
          lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
          email: result.user.email,
          role: 'user',
          phone: '',
          address: '',
          location: '',
          profileImage: '',
          points: 0,
          ordersCount: 0,
          createdAt: new Date().toISOString()
        });
      } else {
        await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
      }
      toast.success('مرحباً بك');
      return true;
    } catch (err) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        toast.error('هذا البريد مسجل بطريقة أخرى. يرجى استخدام البريد وكلمة المرور أولاً.');
      } else {
        toast.error(err.message || 'فشل تسجيل الدخول');
      }
      return false;
    }
  };

  // ✅ إنشاء حساب بالبريد وكلمة المرور
  const register = async (firstName, lastName, email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await firebaseUpdateProfile(result.user, { displayName: `${firstName} ${lastName}` });
      await setDoc(doc(db, "users", result.user.uid), {
        firstName,
        lastName,
        email,
        role: 'user',
        phone: '',
        address: '',
        location: '',
        profileImage: '',
        points: 0,
        ordersCount: 0,
        createdAt: new Date().toISOString()
      });
      await sendEmailVerification(result.user);
      toast.success('تم إنشاء الحساب. يرجى التحقق من بريدك الإلكتروني.');
      return { needVerification: true, email };
    } catch (err) {
      toast.error(err.message || 'فشل التسجيل');
      return false;
    }
  };

  // ✅ تسجيل الدخول بالبريد وكلمة المرور
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('مرحباً بك');
      return true;
    } catch (err) {
      toast.error(err.message || 'بيانات خاطئة');
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('تم الخروج');
    } catch (err) {
      toast.error(err.message || 'فشل تسجيل الخروج');
    }
  };

  const updateProfile = async (data) => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, data, { merge: true });
      setUser(prev => ({ ...prev, ...data }));
      toast.success('تم التحديث');
    } catch (err) {
      toast.error(err.message || 'فشل التحديث');
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}