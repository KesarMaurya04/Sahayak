'use client';
import { useState } from 'react';

export default function ChatComposer({ onSend, disabled }: { onSend: (text: string) => Promise<void> | void; disabled?: boolean; }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const t = text.trim();
    if (!t || disabled) return;
    setBusy(true);
    try { await onSend(t); setText(''); } finally { setBusy(false); }
  };
  return (
    <div className="mt-3 flex gap-2">
      <textarea
        className="input min-h-[44px] flex-1"
        placeholder="Type your message…"
        value={text}
        onChange={(e)=>setText(e.target.value)}
        onKeyDown={(e)=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
      />
      <button className="btn shrink-0" onClick={send} disabled={busy || disabled}>
        {busy ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}