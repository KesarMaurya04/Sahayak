'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
 
type Listing = { _id: string; title: string };
type Slot = { _id: string; listingId: string; start: string; end: string; capacity: number; bookedCount: number; isActive: boolean };
 
export default function AvailabilityPage() {
  const qc = useQueryClient();
  const [listingId, setListingId] = useState<string>('');
  const [date, setDate] = useState<string>(''); // yyyy-mm-dd
  const [startTime, setStartTime] = useState<string>('12:00'); // HH:mm
  const [duration, setDuration] = useState<number>(30);
  const [capacity, setCapacity] = useState<number>(1);
 
  // My listings (for dropdown)
  const { data: listings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => (await apiFetch<{ items: Listing[] }>('/api/listings/mine')).items || [],
  });
 
  useEffect(() => {
    if (!listingId && listings.length > 0) setListingId(listings[0]._id);
  }, [listings, listingId]);
 
  // Slots for chosen listing (or all)
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['my-slots', listingId],
    queryFn: async () => {
      const qs = listingId ? `?listingId=${listingId}` : '';
      return (await apiFetch<{ items: Slot[] }>(`/api/availability/mine${qs}`)).items || [];
    },
    enabled: listings.length > 0,
  });
 
  const addMut = useMutation({
    mutationFn: async () => {
      if (!listingId || !date || !startTime) throw new Error('Missing date/time/listing');
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(start.getTime() + duration * 60000);
      return apiFetch('/api/availability', {
        method: 'POST',
        json: { listingId, start, end, capacity },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-slots'] });
      setDate('');
    },
  });
 
  const delMut = useMutation({
    mutationFn: async (id: string) => apiFetch(`/api/availability/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-slots'] }),
  });
 
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Availability</h1>
 
      <div className="card grid gap-3 md:grid-cols-5">
        <select className="input md:col-span-2" value={listingId} onChange={(e) => setListingId(e.target.value)}>
          {listings.map((l) => <option key={l._id} value={l._id}>{l.title}</option>)}
        </select>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input type="number" className="input" placeholder="Duration (min)" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 30)} />
        <input type="number" className="input" placeholder="Capacity" value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 1)} />
        <button className="btn md:col-span-1" onClick={() => addMut.mutate()} disabled={addMut.isPending}>
          {addMut.isPending ? 'Adding…' : 'Add Slot'}
        </button>
      </div>
 
      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="card">Loading slots…</div>
        ) : slots.length === 0 ? (
          <div className="card text-slate-600">No slots yet.</div>
        ) : (
          slots.map((s) => (
            <article key={s._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {new Date(s.start).toLocaleString('en-IN')} → {new Date(s.end).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-600">Cap {s.capacity} • Booked {s.bookedCount}</div>
                </div>
                <button
                  className="btn-outline text-sm"
                  disabled={delMut.isPending || s.bookedCount > 0}
                  onClick={() => delMut.mutate(s._id)}
                  title={s.bookedCount > 0 ? 'Cannot delete a slot with bookings' : 'Delete slot'}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}