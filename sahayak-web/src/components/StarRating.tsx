'use client';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0 }: { value?: number }) {
  const v = Math.max(0, Math.min(5, value));
  return (
    <div className="flex items-center gap-1 text-brand-600">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} className={i < Math.round(v) ? 'fill-current' : 'opacity-30'} />
      ))}
      <span className="ml-1 text-xs text-slate-600">{v.toFixed(1)}</span>
    </div>
  );
}