
'use client';
import Link from 'next/link';
import { useMyTickets } from '@/hooks/support';
import StatusBadge from '@/components/StatusBadge';

export default function SupportHome() {
  const { data, isLoading, error } = useMyTickets();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Support Tickets</h1>
        <Link className="btn" href="/support/new">New ticket</Link>
      </div>

      {isLoading ? (
        <div className="card">Loading…</div>
      ) : error ? (
        <div className="card text-red-600">Failed to load tickets.</div>
      ) : !data?.length ? (
        <div className="card text-slate-600">No tickets yet. Create your first one.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {data.map((t) => (
            <Link key={t._id} href={`/support/${t._id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft hover:shadow">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium">{t.subject}</div>
                  <div className="text-xs text-slate-600">Created {new Date(t.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}