import { createContext, useContext, useState, useEffect } from 'react';
import ar from '../locales/ar';
import en from '../locales/en';
import de from '../locales/de'; // ✅ استيراد الألمانية


const LanguageContext = createContext(null);
const translations = { ar, en, de }; // ✅ أضفنا de

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || key;

  // ✅ قائمة اللغات المدعومة لاستخدامها في أي مكان
  const supportedLangs = [
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  ];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, supportedLangs }}>
      {children}
    </LanguageContext.Provider>
  );
}