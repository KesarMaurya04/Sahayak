// src/app/listing/[id]/page.tsx
'use client';
 
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import StarRating from '@/components/StarRating';
 
type Listing = {
  _id: string;
  title: string;
  description?: string;
  price: number;
  pricingType: 'fixed' | 'hourly';
  onSite?: boolean;
  avgRating?: number;
};
 
type Slot = {
  _id: string;
  start: string;
  end: string;
  capacity: number;
  bookedCount: number;
  isActive: boolean;
};
 
function money(n: number) {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n); }
  catch { return `₹ ${n}`; }
}
function dt(s: string) {
  const d = new Date(s);
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}
 
export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const nextUrl = useMemo(() => `/listings/${id}`, [id]);
 
  // 1) Listing
  const { data: listing, isLoading: loadingListing, error: errListing } = useQuery({
    queryKey: ['listings', id],
    queryFn: async () => await apiFetch<Listing>(`/api/listings/${id}`),

  });
 
  // 2) Slots (public)
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', id],
    queryFn: async () => {
      const res = await fetch(`/api/availability/public?listingId=${id}`, { credentials: 'include' });
      if (!res.ok) return [] as Slot[];
      const json = await res.json();
      return (json.items as Slot[]) ?? [];
    },
    enabled: !!id,
  });
 
  // 3) Booking (create appointment)
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<null | any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
 
  const reserve = async (slotId: string) => {
    setCreating(true);
    setErrorMsg(null);
    setSuccess(null);
    try {
      // Your router returns the appointment doc directly (not {item})
      const appt = await apiFetch<any>('/api/appointments', {
        method: 'POST',
        json: { listingId: id, slotId },
      });
      setSuccess(appt);
      // Optionally route somewhere:
      // router.push(`/checkout?appointmentId=${appt._id}`);
    } catch (e: any) {
      const msg = e?.message || 'Failed to create booking';
      if (/401|unauthorized/i.test(msg)) {
        router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
        return;
      }
      setErrorMsg(msg);
    } finally {
      setCreating(false);
    }
  };
 
  if (loadingListing) return <div className="card">Loading…</div>;
  if (errListing || !listing) return <div className="card text-red-600">Listing not found.</div>;
 
  return (
    <section className="grid gap-6 md:grid-cols-3">
      {/* Left: gallery + details */}
      <div className="md:col-span-2 card">
        <div className="aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-brand-100 via-brand-200 to-brand-50" />
        <h1 className="mt-4 text-2xl font-semibold">{listing.title}</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
          {typeof listing.avgRating === 'number' && <StarRating value={listing.avgRating} />}
          {listing.onSite && (
            <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
              On-site
            </span>
          )}
          <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs">{listing.pricingType}</span>
        </div>
        {listing.description && <p className="mt-3 text-slate-700">{listing.description}</p>}
      </div>
 
      {/* Right: booking panel */}
      <aside className="card">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm text-slate-500">Starting from</div>
            <div className="text-xl font-semibold">{money(listing.price)}</div>
          </div>
        </div>
 
        {success ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <div className="font-medium">Booking created!</div>
            <div className="mt-1">ID: <span className="font-mono">{success._id}</span></div>
            <div className="mt-1">Status: {success.status}</div>
            <button className="btn mt-3" onClick={() => router.push('/')}>
              Go Home
            </button>
          </div>
        ) : (
          <>
            <h3 className="mt-4 mb-2 text-sm font-medium text-slate-600">Available slots</h3>
            {loadingSlots ? (
              <p className="text-slate-500">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="text-slate-500">No slots found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {slots.map((s) => {
                  const left = Math.max(0, (s.capacity ?? 1) - (s.bookedCount ?? 0));
                  return (
                    <button
                      key={s._id}
                      disabled={creating || left <= 0}
                      onClick={() => reserve(s._id)}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-brand-300 hover:shadow-soft disabled:opacity-50"
                    >
                      <div className="text-sm font-medium">
                        {dt(s.start)} → {dt(s.end)}
                      </div>
                      <div className="text-xs text-slate-500">{left} spot(s) left</div>
                    </button>
                  );
                })}
              </div>
            )}
            {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}
          </>
        )}
      </aside>
    </section>
  );
}