'use client';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

type Listing = { _id: string; title: string; price: number; avgRating?: number; onSite?: boolean };

export default function ExplorePage() {
  const [q, setQ] = useState('');
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      const url = q ? `/api/listings/search?q=${encodeURIComponent(q)}` : '/api/listings/search';
      const r = await apiFetch<{ items: Listing[] }>(url);
      return r.items;
    },
    initialData: [],
  });

  return (
    <section className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Explore</h1>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Search services (e.g. haircut, electrician)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {data?.map((l) => (
          <article key={l._id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow hover:shadow-soft">
            <h3 className="text-lg font-medium">{l.title}</h3>
            <p className="mt-1 text-sm text-slate-600">₹ {l.price}</p>
            {typeof l.avgRating === 'number' && (
              <p className="text-xs text-slate-500">Rating: {l.avgRating.toFixed(1)}</p>
            )}
            <div className="mt-3">
              <button className="btn-outline">View</button>
            </div>
          </article>
        ))}
        {!isFetching && data?.length === 0 && (
          <p className="text-slate-500">No results yet — try a different keyword.</p>
        )}
      </div>
    </section>
  );
}