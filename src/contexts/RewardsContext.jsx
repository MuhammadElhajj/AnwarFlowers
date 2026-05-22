import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

const RewardsContext = createContext(null);

export function useRewards() {
  const context = useContext(RewardsContext);
  if (!context) throw new Error('useRewards must be used within RewardsProvider');
  return context;
}

export function RewardsProvider({ children }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState('new');
  const [coupons, setCoupons] = useState([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // مستويات العضوية – تستخدم الترجمة لاحقاً
  const levels = {
    new: { name: t('levelNew'), icon: '🌱', color: '#10b981', min: 0, max: 1 },
    bronze: { name: t('levelBronze'), icon: '🥉', color: '#cd7f32', min: 1, max: 3 },
    silver: { name: t('levelSilver'), icon: '🥈', color: '#c0c0c0', min: 3, max: 5 },
    gold: { name: t('levelGold'), icon: '🥇', color: '#f59e0b', min: 5, max: 10 },
    diamond: { name: t('levelDiamond'), icon: '💎', color: '#a855f7', min: 10, max: 999 },
  };

  // كوبونات افتراضية – تستخدم الترجمة
  const availableCoupons = [
    { id: 'first_order', name: t('couponFirstOrder'), description: t('couponFirstOrderDesc'), discount: 15, type: 'delivery', requiredOrders: 1, icon: '🚚', color: '#3b82f6' },
    { id: 'second_order', name: t('couponSecondOrder'), description: t('couponSecondOrderDesc'), discount: 50, type: 'delivery', requiredOrders: 2, icon: '🚀', color: '#8b5cf6' },
    { id: 'third_order', name: t('couponThirdOrder'), description: t('couponThirdOrderDesc'), discount: 15, type: 'product', requiredOrders: 3, icon: '🎁', color: '#f59e0b' },
  ];

  const POINTS_PER_ORDER = 100;

  // تحميل بيانات المكافآت من Firestore عند تغير المستخدم
  useEffect(() => {
    if (!user || !user.uid) return;
    const fetchRewards = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPoints(data.points || 0);
          setOrdersCount(data.ordersCount || 0);
          setCoupons(data.coupons || []);
          setAppliedCoupon(data.appliedCoupon || null);
          
          // تحديد المستوى (يتم التقييم بناءً على القيم، والتسمية من levels المترجمة)
          const userLevel = Object.entries(levels).find(([key, val]) =>
            (data.ordersCount || 0) >= val.min && (data.ordersCount || 0) < val.max
          )?.[0] || 'diamond';
          setLevel(userLevel);
        }
      } catch (err) {
        console.error(t('rewardsLoadFailed'), err);
      }
    };
    fetchRewards();
  }, [user, t]);

  // دالة مساعدة لتحديث بيانات المستخدم في Firestore
  const updateUserRewards = async (updates) => {
    if (!user || !user.uid) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, updates, { merge: true });
  };

  // إضافة نقاط بعد طلب جديد
  const addOrderPoints = async () => {
    const newPoints = points + POINTS_PER_ORDER;
    const newOrderCount = ordersCount + 1;
    setPoints(newPoints);
    setOrdersCount(newOrderCount);

    // إضافة كوبونات جديدة حسب عدد الطلبات
    const newCoupons = [...coupons];
    availableCoupons.forEach(coupon => {
      if (newOrderCount >= coupon.requiredOrders && !newCoupons.find(c => c.id === coupon.id)) {
        newCoupons.push({ ...coupon, earnedAt: new Date().toISOString(), used: false });
        toast.success(t('couponEarned', { name: coupon.name }), { duration: 5000 });
      }
    });
    setCoupons(newCoupons);

    // تحديث Firestore
    await updateUserRewards({
      points: newPoints,
      ordersCount: newOrderCount,
      coupons: newCoupons,
    });

    toast.success(t('pointsEarned', { points: POINTS_PER_ORDER }), { duration: 3000 });
  };

  // تطبيق كوبون
  const applyCoupon = (couponId) => {
    const coupon = coupons.find(c => c.id === couponId && !c.used);
    if (coupon) {
      setAppliedCoupon(coupon);
      updateUserRewards({ appliedCoupon: coupon });
      toast.success(t('couponApplied', { name: coupon.name }));
      return coupon;
    }
    toast.error(t('couponNotAvailable'));
    return null;
  };

  // استخدام الكوبون (بعد الطلب)
  const useCoupon = (couponId) => {
    const updatedCoupons = coupons.map(c => c.id === couponId ? { ...c, used: true } : c);
    setCoupons(updatedCoupons);
    setAppliedCoupon(null);
    updateUserRewards({ coupons: updatedCoupons, appliedCoupon: null });
  };

  // إلغاء تطبيق الكوبون
  const removeAppliedCoupon = () => {
    setAppliedCoupon(null);
    updateUserRewards({ appliedCoupon: null });
  };

  // الحصول على الخصم
  const getDeliveryDiscount = () => appliedCoupon?.type === 'delivery' ? appliedCoupon.discount : 0;
  const getProductDiscount = () => appliedCoupon?.type === 'product' ? appliedCoupon.discount : 0;

  // حساب النقاط للمستوى التالي
  const pointsToNextLevel = () => {
    const currentLevel = levels[level];
    const nextLevelOrders = currentLevel.max;
    return nextLevelOrders === 999 ? 0 : Math.max(0, nextLevelOrders - ordersCount);
  };

  // نسبة شريط التقدم
  const progressPercent = () => {
    const currentLevel = levels[level];
    if (currentLevel.max === 999) return 100;
    const range = currentLevel.max - currentLevel.min;
    const progress = ordersCount - currentLevel.min;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  };

  const value = {
    points,
    level,
    ordersCount,
    coupons,
    appliedCoupon,
    levels,
    availableCoupons,
    addOrderPoints,
    applyCoupon,
    useCoupon,
    removeAppliedCoupon,
    getDeliveryDiscount,
    getProductDiscount,
    pointsToNextLevel,
    progressPercent,
    POINTS_PER_ORDER,
  };

  return (
    <RewardsContext.Provider value={value}>
      {children}
    </RewardsContext.Provider>
  );
}