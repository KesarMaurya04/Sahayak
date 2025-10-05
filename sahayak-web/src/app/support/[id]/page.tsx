'use client';
 
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTicket, useSendMessage, useSetTicketStatus } from '@/hooks/support';
import ChatBubble from '@/components/ChatBubble';
import ChatComposer from '@/components/ChatComposer';
import StatusBadge from '@/components/StatusBadge';
import { toast } from '@/lib/toast';
 
const REFRESH_MS = 2500; // light polling
 
export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useTicket(id, { refetchMs: REFRESH_MS });
  const send = useSendMessage(id);
  const setStatus = useSetTicketStatus(id);
 
  const ticket = data?.item;
  const messages = data?.messages ?? [];
  const ai = data?.ai;
 
  const canReply = ticket && !['resolved', 'closed'].includes(ticket.status);
 
  const onSend = async (text: string) => {
    try {
      await send.mutateAsync({ text });
    } catch (e: any) {
      toast(e?.message || 'Failed to send', 'error');
    }
  };
 
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
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <button className="btn-outline text-sm" onClick={() => setStatus.mutate('resolved')}>
              Mark Resolved
            </button>
          )}
          {ticket.status !== 'closed' && (
            <button className="btn-outline text-sm" onClick={() => setStatus.mutate('closed')}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }, [ticket, setStatus]);
 
  if (isLoading) return <div className="card">Loading…</div>;
  if (error || !ticket) return <div className="card text-red-600">Ticket not found.</div>;
 
  return (
    <section className="space-y-4">
      {header}
 
      {(ai?.suggestedAnswer || ai?.ctx?.length) && (
        <div className="card">
          <div className="mb-2 text-sm font-medium text-slate-700">AI suggestion</div>
          {ai.suggestedAnswer && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-slate-800">
              {ai.suggestedAnswer}
            </div>
          )}
          {!!ai?.ctx?.length && (
            <div className="mt-3">
              <div className="text-xs text-slate-500">Relevant articles</div>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-700">
                {ai.ctx.map((c, i) => (
                  <li key={i}>
                    <span className="font-medium">{c.title}</span>
                    {c.snippet ? <> — <span className="text-slate-600">{c.snippet}</span></> : null}
                    {typeof c.score === 'number' ? <> <span className="text-slate-400">(score {c.score.toFixed(2)})</span></> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
 
      <div className="card">
        <div className="space-y-2">
          {messages.map((m) => (
            <ChatBubble key={m._id} who={m.authorType} text={m.text} at={m.createdAt} />
          ))}
        </div>
        <ChatComposer onSend={onSend} disabled={!canReply || send.isPending} />
      </div>
    </section>
  );
}