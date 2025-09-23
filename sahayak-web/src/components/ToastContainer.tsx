'use client';
import { useEffect, useState } from 'react';
import { onToast, type ToastMsg } from '@/lib/toast';
 
export default function ToastContainer() {
  const [items, setItems] = useState<ToastMsg[]>([]);
 
  useEffect(() => {
    return onToast((t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 2600);
    });
  }, []);
 
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 space-y-2 px-3 sm:left-auto sm:right-4 sm:translate-x-0">
      {items.map((t) => (
        <div
          key={t.id}
          className={[
            'pointer-events-auto rounded-2xl px-4 py-3 shadow-soft animate-pop',
            t.variant === 'success' ? 'bg-green-600 text-white'
            : t.variant === 'error' ? 'bg-red-600 text-white'
            : 'bg-slate-800 text-white',
          ].join(' ')}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}