'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
 
type Category = { _id: string; name: string; slug: string; isActive: boolean };
 
export default function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
 
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => (await apiFetch<{ items: Category[] }>('/api/categories')).items ?? [],
  });
 
  const createMut = useMutation({
    mutationFn: async () => apiFetch('/api/categories', { method: 'POST', json: { name, slug } }),
    onSuccess: () => { setName(''); setSlug(''); qc.invalidateQueries({ queryKey: ['admin-categories'] }); },
  });
 
  const toggleMut = useMutation({
    mutationFn: async (c: Category) =>
      apiFetch(`/api/categories/${c._id}`, { method: 'PATCH', json: { isActive: !c.isActive } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  });
 
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Categories</h1>
 
      <div className="card grid gap-3 sm:grid-cols-3">
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="slug (lowercase-hyphen)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <button className="btn" disabled={!name || !slug || createMut.isPending} onClick={() => createMut.mutate()}>
          {createMut.isPending ? 'Creating…' : 'Create'}
        </button>
      </div>
 
      {isLoading ? (
        <div className="card">Loading…</div>
      ) : error ? (
        <div className="card text-red-600">Failed to load categories.</div>
      ) : !data?.length ? (
        <div className="card text-slate-600">No categories yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {data.map((c) => (
            <article key={c._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-medium">{c.name}</div>
                  <div className="text-xs text-slate-600">/{c.slug}</div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={c.isActive} onChange={() => toggleMut.mutate(c)} /> Active
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}