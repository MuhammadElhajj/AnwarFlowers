import { useEffect, useRef, useState, lazy, Suspense } from 'react';

export default function LazyOnViewport({ children, fallback, threshold = 0.1 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // توقف المراقبة بعد التحميل
        }
      },
      { threshold, rootMargin: '100px' } // يبدأ التحميل قبل وصوله بـ 100px
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref}>
      {isVisible ? (
        <Suspense fallback={fallback}>{children}</Suspense>
      ) : (
        fallback || <div style={{ minHeight: 100 }} />
      )}
    </div>
  );
}