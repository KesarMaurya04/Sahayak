'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAdminTickets } from '@/hooks/supportAdmin';
import StatusBadge from '@/components/StatusBadge';

const STATUSES = ['open','in_progress','resolved'] as const;

export default function AdminSupportPage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number] | ''>('');
  const { data, isLoading, error } = useAdminTickets(status || undefined);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Support Inbox</h1>
        <div className="flex items-center gap-2">
          <Link className="btn-outline text-sm" href="/dashboard/admin/support/faq">FAQ</Link>
          <select className="input w-[220px]" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="card">Loading…</div>
      ) : error ? (
        <div className="card text-red-600">Failed to load tickets.</div>
      ) : !data?.length ? (
        <div className="card text-slate-600">No tickets.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {data.map((t) => (
            <Link
              key={t._id}
              href={`/dashboard/admin/support/${t._id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft hover:shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium">{t.subject}</div>
                  <div className="text-xs text-slate-600">Updated {new Date(t.updatedAt).toLocaleString('en-IN')}</div>
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