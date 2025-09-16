'use client';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/lib/format';
 
type Slot = {
  _id: string;
  start: string;
  end: string;
  capacity: number;
  bookedCount: number;
  isActive: boolean;
};
 
export default function Slots({
  listingId,
  onSelect,
}: {
  listingId: string;
  onSelect: (slot: Slot) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['slots', listingId],
    queryFn: async () => {
      const res = await fetch(`/api/availability/public?listingId=${listingId}`, { credentials: 'include' });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.items as Slot[]) ?? [];
    },
  });
 
  if (isLoading) return <p className="text-slate-500">Loading slots…</p>;
  if (!data || data.length === 0) return <p className="text-slate-500">No slots found.</p>;
 
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {data.map((s) => (
        <button
          key={s._id}
          className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-brand-300 hover:shadow-soft"
          onClick={() => onSelect(s)}
        >
          <div className="text-sm font-medium">{formatDateTime(s.start)} → {formatDateTime(s.end)}</div>
          <div className="text-xs text-slate-500">
            {Math.max(0, (s.capacity ?? 1) - (s.bookedCount ?? 0))} spots left
          </div>
        </button>
      ))}
    </div>
  );
}