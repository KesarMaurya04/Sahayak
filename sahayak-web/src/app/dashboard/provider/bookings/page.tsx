'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
 
type Appt = {
  _id: string;
  titleSnapshot: string;
  status: 'pending'|'confirmed'|'completed'|'canceled';
  paymentStatus?: 'unpaid'|'paid'|'refunded';
  createdAt: string;
};
 
export default function ProviderBookingsPage() {
  const qc = useQueryClient();
 
  const { data, isLoading, error } = useQuery({
    queryKey: ['provider-bookings'],
    queryFn: async () => (await apiFetch<{ items: Appt[] }>('/api/appointments/provider')).items || [],
  });
 
  const confirmMut = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/appointments/${id}/confirm`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['provider-bookings'] }),
  });
 
  const completeMut = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/appointments/${id}/complete`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['provider-bookings'] }),
  });
 
  if (isLoading) return <div className="card">Loading…</div>;
  if (error) return <div className="card text-red-600">Failed to load bookings.</div>;
 
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Provider Bookings</h1>
      {(!data || data.length === 0) ? (
        <div className="card text-slate-600">No bookings yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {data.map((b) => (
            <article key={b._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium">{b.titleSnapshot || 'Service'}</div>
                  <div className="text-xs text-slate-600">
                    Created: {new Date(b.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>Status: <b>{b.status}</b>{b.paymentStatus ? ` • ${b.paymentStatus}` : ''}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {b.status === 'pending' && (
                  <button className="btn-outline text-sm" disabled={confirmMut.isPending} onClick={() => confirmMut.mutate(b._id)}>
                    {confirmMut.isPending ? 'Confirming…' : 'Confirm'}
                  </button>
                )}
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <button className="btn text-sm" disabled={completeMut.isPending} onClick={() => completeMut.mutate(b._id)}>
                    {completeMut.isPending ? 'Completing…' : 'Mark Completed'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}