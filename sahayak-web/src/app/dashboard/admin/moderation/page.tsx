'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
 
type Listing = { _id: string; title: string; price: number; ownerType: string; moderationStatus: string };
 
export default function ModerationPage() {
  const qc = useQueryClient();
 
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => {
      // expects a backend admin endpoint returning pending listings
      // see tiny backend shim below
      const r = await apiFetch<{ items: Listing[] }>('/api/admin/listings?status=pending');
      return r.items ?? [];
    },
  });
 
  const modMut = useMutation({
    mutationFn: async (payload: { id: string; status: 'approved' | 'rejected' | 'pending' }) =>
      apiFetch(`/api/listings/${payload.id}/moderate`, { method: 'POST', json: { status: payload.status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pending'] }),
  });
 
  if (isLoading) return <div className="card">Loading…</div>;
  if (error) return <div className="card text-red-600">Failed to load pending listings.</div>;
 
  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold">Moderation</h1>
      {!data?.length ? (
        <div className="card text-slate-600">No pending listings 🎉</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {data.map((l) => (
            <article key={l._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium">{l.title}</div>
                  <div className="text-xs text-slate-600">Type: {l.ownerType} • Status: {l.moderationStatus}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline text-sm" onClick={() => modMut.mutate({ id: l._id, status: 'rejected' })}
                          disabled={modMut.isPending}>Reject</button>
                  <button className="btn text-sm" onClick={() => modMut.mutate({ id: l._id, status: 'approved' })}
                          disabled={modMut.isPending}>Approve</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}