'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
 
type Listing = { 
  _id: string; 
  title: string; 
  price: number; 
  ownerType: string; 
  moderationStatus: string;
  description?: string;
  createdAt?: string;
  moderationNote?: string;
};
 
type ModerationResponse = {
  items: Listing[];
  total: number;
  page: number;
  limit: number;
};
 
export default function ModerationPage() {
  const qc = useQueryClient();
 
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => {
      try {
        console.log('Fetching pending listings...'); // Debug log
 
        // Use the correct backend route: /api/admin/moderation/listings?status=pending
        const response = await apiFetch<ModerationResponse>('/api/admin/moderation/listings?status=pending');
        console.log('Moderation response:', response); // Debug log
 
        // Backend returns { items, total, page, limit }
        return response.items || [];
      } catch (e) {
        console.error('Failed to fetch pending listings:', e);
        throw e;
      }
    },
  });
 
  const modMut = useMutation({
    mutationFn: async (payload: { id: string; status: 'approved' | 'rejected'; note?: string }) => {
      console.log('Moderating listing:', payload); // Debug log
 
      try {
        // Use the correct backend route: /api/admin/moderation/listings/:id
        const result = await apiFetch(`/api/admin/moderation/listings/${payload.id}`, { 
          method: 'PATCH', 
          json: { 
            status: payload.status,
            note: payload.note 
          } 
        });
        console.log('Moderation success:', result); // Debug log
        return result;
      } catch (e) {
        console.error('Moderation failed:', e);
        throw e;
      }
    },
    onSuccess: () => {
      console.log('Moderation successful, refreshing list'); // Debug log
      qc.invalidateQueries({ queryKey: ['admin-pending'] });
    },
    onError: (error) => {
      console.error('Moderation error:', error);
      alert(`Failed to moderate listing: ${error.message || 'Unknown error'}`);
    }
  });
 
  const handleModerate = (id: string, status: 'approved' | 'rejected') => {
    const action = status === 'approved' ? 'approve' : 'reject';
    let note = '';
 
    if (status === 'rejected') {
      note = prompt('Reason for rejection (optional):') || '';
    }
 
    if (confirm(`Are you sure you want to ${action} this listing?`)) {
      modMut.mutate({ id, status, note: note || undefined });
    }
  };
 
  if (isLoading) return <div className="card">Loading pending listings…</div>;
 
  if (error) return (
    <div className="card text-red-600">
      Failed to load pending listings: {error.message || 'Unknown error'}
      <button 
        className="btn-outline mt-2" 
        onClick={() => qc.invalidateQueries({ queryKey: ['admin-pending'] })}
      >
        Retry
      </button>
    </div>
  );
 
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Moderation</h1>
        <button 
          className="btn-outline text-sm" 
          onClick={() => qc.invalidateQueries({ queryKey: ['admin-pending'] })}
        >
          Refresh
        </button>
      </div>
 
      {/* Show moderation errors */}
      {modMut.error && (
        <div className="card bg-red-50 text-red-600">
          Error: {modMut.error.message || 'Failed to moderate listing'}
        </div>
      )}
 
      {!data?.length ? (
        <div className="card text-slate-600">No pending listings 🎉</div>
      ) : (
        <>
          <div className="text-sm text-slate-600">
            {data.length} listing{data.length !== 1 ? 's' : ''} pending review
          </div>
 
          <div className="grid grid-cols-1 gap-3">
            {data.map((l) => (
              <article key={l._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{l.title}</div>
                    {l.description && (
                      <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                        {l.description}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Price: ₹{l.price}</span>
                      <span>•</span>
                      <span>Type: {l.ownerType}</span>
                      <span>•</span>
                      <span>Status: {l.moderationStatus}</span>
                      {l.createdAt && (
                        <>
                          <span>•</span>
                          <span>Created: {new Date(l.createdAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    {l.moderationNote && (
                      <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        Note: {l.moderationNote}
                      </div>
                    )}
                  </div>
 
                  <div className="flex gap-2 shrink-0">
                    <button 
                      className="btn-outline text-sm px-3 py-1" 
                      onClick={() => handleModerate(l._id, 'rejected')}
                      disabled={modMut.isPending}
                    >
                      {modMut.isPending ? '...' : 'Reject'}
                    </button>
                    <button 
                      className="btn text-sm px-3 py-1" 
                      onClick={() => handleModerate(l._id, 'approved')}
                      disabled={modMut.isPending}
                    >
                      {modMut.isPending ? '...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}