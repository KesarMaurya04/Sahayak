'use client';
 
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import Toggle from './Toggle';
import { MapPin } from 'lucide-react';
 
export type Filters = {
  q?: string;
  categoryId?: string;
  onsite?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'relevance' | 'nearest' | 'price_asc' | 'price_desc' | 'recent';
  lat?: number;
  lng?: number;
  radiusKm?: number;
};
 
type Category = { _id: string; name: string; slug: string; parent?: string | null };
 
export default function FiltersBar({
  initial,
  onApply,
}: {
  initial: Partial<Filters>;
  onApply: (f: Partial<Filters>) => void;
}) {
  const [q, setQ] = useState(initial.q ?? '');
  const [onsite, setOnsite] = useState(!!initial.onsite);
  const [minPrice, setMinPrice] = useState<number | undefined>(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(initial.maxPrice);
  const [sort, setSort] = useState<Filters['sort']>(initial.sort || 'relevance');
  const [categoryId, setCategoryId] = useState<string | undefined>(initial.categoryId);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number; radiusKm?: number }>({
    lat: initial.lat,
    lng: initial.lng,
    radiusKm: initial.radiusKm ?? 10,
  });
 
  const qDeb = useDebounce(q, 350);
 
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch<{ items: Category[] }>('/api/categories');
        setCats(r.items || []);
      } catch {
        // fallback (ignore)
      }
    })();
  }, []);
 
  // auto-apply on debounced search text or quick toggles
  useEffect(() => {
    onApply({
      q: qDeb || undefined,
      onsite: onsite || undefined,
      minPrice,
      maxPrice,
      sort,
      categoryId,
      lat: coords.lat,
      lng: coords.lng,
      radiusKm: coords.radiusKm,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDeb, onsite, minPrice, maxPrice, sort, categoryId, coords.lat, coords.lng, coords.radiusKm]);
 
  const useMyLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords((c) => ({
          ...c,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radiusKm: c.radiusKm ?? 10,
        }));
      },
      () => {
        // ignore errors
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };
 
  const priceLabel = useMemo(() => {
    const min = minPrice ?? 0;
    const max = maxPrice ?? 0;
    if (!min && !max) return 'Any';
    if (min && max) return `₹${min} – ₹${max}`;
    if (min) return `≥ ₹${min}`;
    return `≤ ₹${max}`;
  }, [minPrice, maxPrice]);
 
  return (
    <div className="card">
      <div className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <input
            className="input"
            placeholder="Search services (e.g., haircut, electrician)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
 
        <div className="md:col-span-3">
          <select
            className="input"
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value || undefined)}
          >
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
 
        <div className="md:col-span-2">
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as Filters['sort'])}>
            <option value="relevance">Sort: Relevance</option>
            <option value="nearest">Sort: Nearest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
 
        <div className="md:col-span-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-sm text-slate-700">On-site only</span>
          <Toggle checked={onsite} onChange={setOnsite} label="On-site filter" />
        </div>
      </div>
 
      {/* Price + Location row */}
      <div className="mt-3 grid gap-3 md:grid-cols-12">
        <div className="md:col-span-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <span className="text-sm text-slate-700">Price</span>
          <input
            className="input"
            placeholder="Min"
            inputMode="numeric"
            value={minPrice ?? ''}
            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
          />
          <span className="text-slate-400">—</span>
          <input
            className="input"
            placeholder="Max"
            inputMode="numeric"
            value={maxPrice ?? ''}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
          />
          <span className="ml-auto text-xs text-slate-500">{priceLabel}</span>
        </div>
 
        <div className="md:col-span-8 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <button
            type="button"
            onClick={useMyLocation}
            className="btn-outline inline-flex items-center gap-1"
            title="Use my location"
          >
            <MapPin size={16} /> Use my location
          </button>
          <input
            className="input"
            placeholder="Lat"
            value={coords.lat ?? ''}
            onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value ? Number(e.target.value) : undefined }))}
          />
          <input
            className="input"
            placeholder="Lng"
            value={coords.lng ?? ''}
            onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value ? Number(e.target.value) : undefined }))}
          />
          <input
            className="input"
            placeholder="Radius (km)"
            value={coords.radiusKm ?? 10}
            onChange={(e) => setCoords((c) => ({ ...c, radiusKm: e.target.value ? Number(e.target.value) : undefined }))}
          />
        </div>
      </div>
    </div>
  );
}