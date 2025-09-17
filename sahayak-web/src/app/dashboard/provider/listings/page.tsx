'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
 
type Listing = {
  _id: string;
  title: string;
  price: number;
  isActive: boolean;
  moderationStatus: 'pending'|'approved'|'rejected';
  pricingType: 'fixed'|'hourly';
  onSite?: boolean;
};
 
export default function ProviderListingsPage() {
  const qc = useQueryClient();
 
const { data, isLoading, error } = useQuery({
  queryKey: ['my-listings'],
  queryFn: async () => {
    const res = await apiFetch<{ items: Listing[] }>('/api/listings/mine');
    console.log("API response:", res);
    return res.items || [];
  },
});
 
  const patchMut = useMutation({
    mutationFn: async (payload: { id: string; patch: Partial<Listing> }) => {
      return apiFetch(`/api/listings/${payload.id}`, { method: 'PATCH', json: payload.patch });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
  });
 
  if (isLoading) return <div className="card">Loading…</div>;
  if (error) return <div className="card text-red-600">Failed to load listings.</div>;
 
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Listings</h1>
        <Link href="/dashboard/provider/listings/new" className="btn">New Listing</Link>
      </div>
 
      {(!data || data.length === 0) ? (
        <div className="card text-slate-600">No listings yet. Click “New Listing”.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {data.map((l) => (
            <article key={l._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium">{l.title}</div>
                  <div className="text-xs text-slate-600">
                    Status: <b>{l.moderationStatus}</b> • {l.onSite ? 'On-site' : 'Remote'} • {l.pricingType}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatMoney(l.price)}</div>
                  <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={l.isActive}
                      onChange={(e) => patchMut.mutate({ id: l._id, patch: { isActive: e.target.checked } })}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-outline text-sm"
                  onClick={() => {
                    const v = prompt('New price (₹):', String(l.price));
                    if (v) {
                      const price = Number(v);
                      if (!Number.isNaN(price)) patchMut.mutate({ id: l._id, patch: { price } });
                    }
                  }}
                >
                  Edit Price
                </button>
                <a href={`/listing/${l._id}`} className="btn-outline text-sm">View Public</a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}