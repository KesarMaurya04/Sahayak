'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAdminTicket, useAdminReply, useAdminSetStatus } from '@/hooks/supportAdmin';
import StatusBadge from '@/components/StatusBadge';
import { toast } from '@/lib/toast';

function Bubble({ who, text, at }: { who: 'user' | 'admin'; text: string; at: string }) {
  const align = who === 'user' ? 'justify-start' : 'justify-end';
  const bubble =
    who === 'user' ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-white';

  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${bubble}`}>
        <div className="whitespace-pre-wrap text-sm">{text}</div>
        <div className="mt-1 text-[10px] opacity-70">{new Date(at).toLocaleString('en-IN')}</div>
      </div>
    </div>
  );
}

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: ticket, isLoading, error } = useAdminTicket(id);
  const setStatus = useAdminSetStatus(id);
  const reply = useAdminReply(id);
  const [text, setText] = useState('');

  const header = useMemo(() => {
    if (!ticket) return null;
    return (
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{ticket.subject}</div>
          <div className="text-xs text-slate-600">Created {new Date(ticket.createdAt).toLocaleString('en-IN')}</div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <select
            className="input text-sm"
            defaultValue={ticket.status}
            onChange={(e) => setStatus.mutate(e.target.value as any)}
          >
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>
    );
  }, [ticket, setStatus]);

  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    try {
      await reply.mutateAsync(t);
      setText('');
    } catch (e: any) {
      toast(e?.message || 'Failed to send', 'error');
    }
  };

  if (isLoading) return <div className="card">Loading…</div>;
  if (error || !ticket) return <div className="card text-red-600">Ticket not found.</div>;

  return (
    <section className="space-y-4">
      {header}

      <div className="card">
        <div className="space-y-2">
          {(ticket.messages ?? []).map((m) => (
            <Bubble key={(m as any)._id} who={m.senderType} text={m.text} at={m.createdAt} />
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <textarea
            className="input min-h-[44px] flex-1"
            placeholder="Reply to customer…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
            }}
          />
          <button className="btn shrink-0" onClick={onSend} disabled={reply.isPending}>
            {reply.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </section>
  );
}