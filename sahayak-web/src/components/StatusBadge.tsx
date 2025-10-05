import React from 'react';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'canceled';
type TicketStatus = 'open' | 'pending' | 'awaiting_customer' | 'resolved' | 'closed';
type AnyStatus = BookingStatus | TicketStatus | string;

type Props = {
  status: AnyStatus;
  size?: 'sm' | 'md';
  className?: string;
};

const STYLES: Record<string, string> = {
  // Bookings
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-purple-100 text-purple-800 border-purple-200',
  canceled: 'bg-rose-100 text-rose-800 border-rose-200',

  // Tickets
  open: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  awaiting_customer: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved: 'bg-purple-100 text-purple-800 border-purple-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function StatusBadge({ status, size = 'md', className = '' }: Props) {
  const key = String(status || '').toLowerCase();
  const base = 'inline-flex items-center rounded-full border';
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';
  const style = STYLES[key] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  const label = formatLabel(key);

  return <span className={`${base} ${pad} ${style} ${className}`}>{label || 'Unknown'}</span>;
}