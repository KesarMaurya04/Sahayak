'use client';
 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatMoney } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
 
type Booking = {
  _id: string;
  titleSnapshot?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  priceSnapshot?: number;
  createdAt: string;
 
  // Optional fields if your API includes them:
  slot?: { start?: string; end?: string };
  slotStart?: string;
  slotEnd?: string;
  listingId?: string;
};
 
export default function CustomerBookingsPage() {
  const qc = useQueryClient();
 
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-bookings'],
    queryFn: async () => {
      const r = await apiFetch<{ items: Booking[]; total?: number }>('/api/bookings/me');
      return r.items ?? [];
    },
    retry: false,
  });
 
  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/bookings/${id}/cancel`, { method: 'PATCH' });
    },
    onSuccess: () => {
      toast('Booking canceled', 'success');
      qc.invalidateQueries({ queryKey: ['customer-bookings'] });
    },
    onError: (e: any) => toast(e?.message || 'Failed to cancel', 'error'),
  });
 
  const handleCancel = (b: Booking) => {
    if (b.status === 'canceled' || b.status === 'completed') return;
    const ok = confirm('Cancel this booking? This action cannot be undone.');
    if (ok) cancelMut.mutate(b._id);
  };
 
  if (isLoading) return <div className="card">Loading…</div>;
 
  if (error) {
    const msg = (error as Error).message || '';
    if (/401|unauthorized/i.test(msg)) {
      if (typeof window !== 'undefined') location.href = `/login?next=${encodeURIComponent('/bookings')}`;
      return null;
    }
    return <div className="card text-red-600">Failed to load bookings.</div>;
  }
 
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">My Bookings</h1>
 
      {(!data || data.length === 0) ? (
        <div className="card text-slate-600">No bookings yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {data.map((b) => {
            const price = typeof b.priceSnapshot === 'number' ? formatMoney(b.priceSnapshot) : '';
            const start =
              b.slot?.start || b.slotStart ? new Date(b.slot?.start ?? (b.slotStart as string)).toLocaleString('en-IN') : null;
            const end =
              b.slot?.end || b.slotEnd ? new Date(b.slot?.end ?? (b.slotEnd as string)).toLocaleString('en-IN') : null;
 
            return (
              <article key={b._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium">{b.titleSnapshot || 'Service booking'}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>Created {new Date(b.createdAt).toLocaleString('en-IN')}</span>
                      {start && end && <span>• Slot: {start} → {end}</span>}
                      {price && <span>• {price}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.paymentStatus && <span className="text-xs text-slate-600">• {b.paymentStatus}</span>}
                  </div>
                </div>
 
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.listingId && (
                    <a className="btn-outline text-sm" href={`/listing/${b.listingId}`}>View Listing</a>
                  )}
                  {(b.status !== 'canceled' && b.status !== 'completed') && (
                    <button
                      className="btn-outline text-sm"
                      onClick={() => handleCancel(b)}
                      disabled={cancelMut.isPending}
                      title="Cancel booking"
                    >
                      {cancelMut.isPending ? 'Canceling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}