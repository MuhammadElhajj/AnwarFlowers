import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  collection, addDoc, doc, setDoc, updateDoc, getDoc, getDocs,
  query, where, increment, serverTimestamp, limit
} from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

// أسعار الإضافات (للتوافق القديم، قد لا تُستخدم حالياً)
export const ADDON_PRICES = {
  glitter: 3, spray: 5, crown: 10, teddy: 8,
};
export const MESSAGE_COLORS = [
  { value: 'gold', label: 'ذهبي', code: '#FFD700' },
  { value: 'white', label: 'أبيض', code: '#FFFFFF' },
  { value: 'black', label: 'أسود', code: '#000000' },
  { value: 'red', label: 'أحمر', code: '#FF0000' },
  { value: 'pink', label: 'وردي', code: '#FF69B4' },
  { value: 'silver', label: 'فضي', code: '#C0C0C0' },
];
export const MESSAGE_PLACEMENTS = [
  { value: 'card', label: 'بطاقة خارجية' },
  { value: 'ribbon', label: 'على الشريط' },
  { value: 'inside', label: 'داخل الباقة' },
];

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [wrappingType, setWrappingType] = useState('basic');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('morning');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // خيارات التخصيص
  const [customMessage, setCustomMessage] = useState('');
  const [messageColor, setMessageColor] = useState('gold');
  const [messagePlacement, setMessagePlacement] = useState('card');
  const [wrappingColor, setWrappingColor] = useState('#FF69B4');
  const [selectedAddons, setSelectedAddons] = useState([]);

  // ✅ الإضافات الديناميكية من Firestore
  const [addonsList, setAddonsList] = useState([]);

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const snap = await getDocs(collection(db, 'addons'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAddonsList(list);
      } catch (err) {
        console.error('فشل جلب الإضافات الديناميكية:', err);
        setAddonsList([]); // نضمن بقاءها مصفوفة
      }
    };
    fetchAddons();
  }, []);

  const deliveryPrices = { standard: 5, express: 15, sameDay: 25 };
  const wrappingPrices = { basic: 5, premium: 12, luxury: 25 };
  const timePrices = { morning: 0, afternoon: 0, evening: 10, night: 20 };

  // ✅ تعديل toggleAddon ليعمل بمعرف الإضافة (id) بدلاً من المفاتيح القديمة
  const toggleAddon = (addonId) => {
    setSelectedAddons(prev =>
      prev.includes(addonId) ? prev.filter(a => a !== addonId) : [...prev, addonId]
    );
  };

  // ✅ حساب تكلفة الإضافات المختارة من القائمة الديناميكية
  const calculateAddonsCost = () => {
    // إذا كانت addonsList فارغة، نستخدم الأسعار القديمة (للتوافق مع أي بيانات قديمة)
    if (addonsList.length === 0) {
      return selectedAddons.reduce((total, addonKey) => total + (ADDON_PRICES[addonKey] || 0), 0);
    }
    return selectedAddons.reduce((total, addonId) => {
      const addon = addonsList.find(a => a.id === addonId);
      return total + (addon?.price || 0);
    }, 0);
  };

  const addToCart = (product, quantity = 1) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        return prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
    toast.success('✅ تمت الإضافة إلى السلة');
  };

  const removeFromCart = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast('🗑️ تم حذف المنتج');
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCustomMessage('');
    setSelectedAddons([]);
  };

  const cartCount = () => items.reduce((t, i) => t + i.quantity, 0);

  // ✅ الكوبونات (محدثة لدعم كوبونات المستخدم)
  const applyCouponToCart = async (code) => {
    try {
      // البحث في كوبونات المتجر العامة
      const q = query(collection(db, 'coupons'), where('code', '==', code), where('used', '==', false));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setAppliedCoupon(coupon);
        toast.success(`✅ تم تطبيق: ${coupon.name || coupon.code}`);
        return;
      }
      // البحث في كوبونات المستخدم الخاصة
      if (user) {
        const userCouponQ = query(
          collection(db, 'userCoupons'),
          where('code', '==', code),
          where('userId', '==', user.uid),
          where('used', '==', false)
        );
        const userSnap = await getDocs(userCouponQ);
        if (!userSnap.empty) {
          const coupon = { id: userSnap.docs[0].id, ...userSnap.docs[0].data() };
          setAppliedCoupon(coupon);
          toast.success(`🎫 تم تطبيق كوبونك الخاص: ${coupon.name || coupon.code}`);
          return;
        }
      }
      toast.error('❌ الكوبون غير صالح أو منتهي');
    } catch (err) {
      toast.error('فشل التحقق من الكوبون');
    }
  };

  const removeCouponFromCart = () => {
    setAppliedCoupon(null);
    toast('🚫 تم إلغاء الكوبون');
  };

  const calculateCost = () => {
    const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);
    let deliveryCost = deliveryPrices[deliveryMethod] || 5;
    const wrappingCost = wrappingPrices[wrappingType] || 5;
    const timeCost = timePrices[deliveryTime] || 0;
    const addonsCost = calculateAddonsCost();

    let discountAmount = 0;
    let discountLabel = '';

    if (appliedCoupon && !appliedCoupon.used) {
      if (appliedCoupon.type === 'delivery') {
        discountAmount = (deliveryCost * appliedCoupon.discount) / 100;
        discountLabel = `خصم ${appliedCoupon.discount}% على التوصيل`;
      } else if (appliedCoupon.type === 'product') {
        discountAmount = ((subtotal + addonsCost) * appliedCoupon.discount) / 100;
        discountLabel = `خصم ${appliedCoupon.discount}% على المنتجات`;
      }
    }

    const subtotalAfterDiscount = subtotal + addonsCost - (appliedCoupon?.type === 'product' ? discountAmount : 0);
    const deliveryAfterDiscount = deliveryCost - (appliedCoupon?.type === 'delivery' ? discountAmount : 0);
    const tax = (subtotalAfterDiscount + deliveryAfterDiscount + wrappingCost + timeCost) * 0.15;
    const total = subtotalAfterDiscount + deliveryAfterDiscount + wrappingCost + timeCost + tax;

    return {
      subtotal: subtotal.toFixed(2),
      addonsCost: addonsCost.toFixed(2),
      deliveryCost: deliveryCost.toFixed(2),
      wrappingCost: wrappingCost.toFixed(2),
      timeCost: timeCost.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      discountLabel,
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      itemCount: cartCount(),
    };
  };

  const totalPrice = () => parseFloat(calculateCost().total);

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    if (user?.displayName) return user.displayName;
    return user?.email || 'مستخدم';
  };

  // ✅ توليد كوبون ولاء تلقائي بعد الطلب
  const generateLoyaltyCoupon = async () => {
    if (!user) return;
    const code = 'LOYAL' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const couponData = {
      code,
      name: 'كوبون الولاء',
      type: 'product',
      discount: 10,
      used: false,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    try {
      await addDoc(collection(db, 'userCoupons'), couponData);
      return code;
    } catch (err) {
      console.error('فشل إنشاء كوبون الولاء', err);
      return null;
    }
  };

  // ✅ تقديم الطلب مع تفاصيل الإضافات الديناميكية
  const placeOrder = async (paymentMethod, transactionNumber = '') => {
    if (!user?.uid) {
      toast.error('يجب تسجيل الدخول لإتمام الطلب');
      return null;
    }
    if (items.length === 0) {
      toast.error('❌ السلة فارغة!');
      return null;
    }

    const costs = calculateCost();
    const customerName = getUserDisplayName();

    // ✅ تحويل معرفات الإضافات إلى تفاصيل كاملة
    const selectedAddonDetails = selectedAddons.map(addonId => {
      const addon = addonsList.find(a => a.id === addonId);
      return addon ? { id: addon.id, name: addon.name, price: addon.price, icon: addon.icon } : null;
    }).filter(Boolean);

    const orderData = {
      userId: user.uid,
      items: items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      subtotal: parseFloat(costs.subtotal),
      addonsCost: parseFloat(costs.addonsCost),
      deliveryCost: parseFloat(costs.deliveryCost),
      wrappingCost: parseFloat(costs.wrappingCost),
      timeCost: parseFloat(costs.timeCost),
      tax: parseFloat(costs.tax),
      total: parseFloat(costs.total),
      discountAmount: parseFloat(costs.discountAmount),
      discountLabel: costs.discountLabel,
      paymentMethod,
      transactionNumber,
      deliveryMethod,
      wrappingType,
      deliveryDate,
      deliveryTime,
      appliedCoupon: appliedCoupon || null,
      customMessage,
      messageColor,
      messagePlacement,
      wrappingColor,
      selectedAddons: selectedAddonDetails, // ✅ نُخزّن التفاصيل الكاملة
      customer: {
        name: customerName,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
      },
      status: 'pending',
      statusText: 'قيد التجهيز',
      createdAt: serverTimestamp(),
    };

    try {
      // 1. حفظ الطلب
      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // 2. تحديث نقاط المستخدم وعدد الطلبات
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          points: increment(100),
          ordersCount: increment(1),
        });
      } catch (updateErr) {
        if (updateErr.code === 'not-found') {
          await setDoc(userRef, {
            firstName: user.firstName || user.displayName?.split(' ')[0] || 'مستخدم',
            lastName: user.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email,
            role: user.role || 'user',
            points: 100,
            ordersCount: 1,
            phone: user.phone || '',
            address: user.address || '',
            createdAt: new Date().toISOString(),
          });
        } else {
          console.error('فشل تحديث بيانات المستخدم:', updateErr);
        }
      }

      // 3. إنشاء كوبون ولاء تلقائي 🎫
      const couponCode = await generateLoyaltyCoupon();
      if (couponCode) {
        toast.success(`🎉 تم الطلب! كوبون هدية: ${couponCode} (خصم 10% لطلبك القادم)`, { duration: 6000 });
      } else {
        toast.success('🎉 تم تقديم الطلب بنجاح!');
      }

      // 4. تحديث الكوبون المُستخدم (عام أو خاص)
      if (appliedCoupon) {
        try {
          if (appliedCoupon.userId) {
            await updateDoc(doc(db, 'userCoupons', appliedCoupon.id), {
              used: true,
              usedAt: new Date().toISOString()
            });
          } else {
            await updateDoc(doc(db, 'coupons', appliedCoupon.id), {
              used: true,
              usedBy: user.uid,
              usedAt: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error('فشل تحديث الكوبون:', e);
        }
      }

      clearCart();
      return { id: docRef.id, ...orderData };
    } catch (error) {
      toast.error(error.message || '❌ فشل حفظ الطلب');
      return null;
    }
  };

  // دالة حذف الطلب (للمستخدم)
  const deleteMyOrder = async (orderId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled', statusText: 'ملغي' });
      toast.success('تم إلغاء الطلب');
      return true;
    } catch (err) {
      toast.error('فشل إلغاء الطلب');
      return false;
    }
  };

  const value = {
    items, addToCart, removeFromCart, updateQty, clearCart,
    cartCount, totalPrice, calculateCost, placeOrder, deleteMyOrder,
    deliveryMethod, setDeliveryMethod,
    wrappingType, setWrappingType,
    deliveryDate, setDeliveryDate,
    deliveryTime, setDeliveryTime,
    deliveryPrices, wrappingPrices, timePrices,
    appliedCoupon, applyCouponToCart, removeCouponFromCart,
    customMessage, setCustomMessage,
    messageColor, setMessageColor,
    messagePlacement, setMessagePlacement,
    wrappingColor, setWrappingColor,
    selectedAddons, toggleAddon,
    addonsList,               // ✅ إضافة addonsList
    ADDON_PRICES, MESSAGE_COLORS, MESSAGE_PLACEMENTS
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}