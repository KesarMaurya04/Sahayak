'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateTicket } from '@/hooks/support';
import { toast } from '@/lib/toast';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

type Category = { _id: string; name: string; isActive?: boolean };

export default function ProviderNewTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const create = useCreateTicket();

  const { data: catsResp } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => apiFetch<{ items: Category[] }>('/api/categories'),
  });
  const cats = (catsResp?.items ?? []).filter((c) => c.isActive !== false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast('Subject and message are required', 'error');
      return;
    }
    try {
      const res = await create.mutateAsync({
        subject: subject.trim(),
        categoryId: categoryId || undefined,
        message: message.trim(),
      });
      toast('Ticket created', 'success');
      router.push(`/dashboard/provider/support/${res.item._id}`);
    } catch (e: any) {
      toast(e?.message || 'Failed to create ticket', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl card">
      <h1 className="mb-3 text-xl font-semibold">New support ticket</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm">Subject</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm">Category</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">(Uncategorized)</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm">Message</label>
          <textarea
            className="input min-h-[120px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 flex gap-2">
          <button className="btn" onClick={submit} disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create ticket'}
          </button>
          <button className="btn-outline" onClick={() => history.back()}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}