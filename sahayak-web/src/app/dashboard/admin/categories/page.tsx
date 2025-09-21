'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
 
type Category = { _id: string; name: string; slug: string; isActive: boolean };
 
// Simple slugify function to match backend
function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
 
export default function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
 
  // Auto-generate slug when name changes
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  };
 
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      try {
        // Backend returns array directly (not wrapped in items)
        const response = await apiFetch<Category[]>('/api/admin/categories');
        console.log('Fetched categories:', response); // Debug log
        return Array.isArray(response) ? response : [];
      } catch (e) {
        console.error('Failed to fetch categories:', e);
        throw e;
      }
    },
  });
 
  const createMut = useMutation({
    mutationFn: async () => {
      console.log('Creating category:', { name, slug }); // Debug log
 
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name.trim()),
        isActive: true
      };
 
      console.log('Payload:', payload); // Debug log
 
      try {
        const result = await apiFetch('/api/admin/categories', { 
          method: 'POST', 
          json: payload 
        });
        console.log('Create success:', result); // Debug log
        return result;
      } catch (e) {
        console.error('Create failed:', e); // Debug log
        throw e;
      }
    },
    onSuccess: () => { 
      console.log('Mutation successful, clearing form'); // Debug log
      setName(''); 
      setSlug(''); 
      qc.invalidateQueries({ queryKey: ['admin-categories'] }); 
    },
    onError: (error) => {
      console.error('Mutation error:', error); // Debug log
      alert(`Failed to create category: ${error.message || 'Unknown error'}`);
    }
  });
 
  const toggleMut = useMutation({
    mutationFn: async (c: Category) => {
      console.log('Toggling category:', c._id, !c.isActive); // Debug log
      try {
        return await apiFetch(`/api/admin/categories/${c._id}`, { 
          method: 'PATCH', 
          json: { isActive: !c.isActive } 
        });
      } catch (e) {
        console.error('Toggle failed:', e);
        throw e;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
    onError: (error) => {
      console.error('Toggle error:', error);
      alert(`Failed to update category: ${error.message || 'Unknown error'}`);
    }
  });
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createMut.mutate();
    }
  };
 
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Categories</h1>
 
      <form onSubmit={handleSubmit} className="card grid gap-3 sm:grid-cols-3">
        <input 
          className="input" 
          placeholder="Category Name" 
          value={name} 
          onChange={(e) => handleNameChange(e.target.value)}
          required 
        />
        <input 
          className="input" 
          placeholder="slug (auto-generated)" 
          value={slug} 
          onChange={(e) => setSlug(e.target.value)} 
        />
        <button 
          type="submit"
          className="btn" 
          disabled={!name.trim() || createMut.isPending}
        >
          {createMut.isPending ? 'Creating…' : 'Create Category'}
        </button>
      </form>
 
      {/* Show any create errors */}
      {createMut.error && (
        <div className="card bg-red-50 text-red-600">
          Error: {createMut.error.message || 'Failed to create category'}
        </div>
      )}
 
      {isLoading ? (
        <div className="card">Loading categories…</div>
      ) : error ? (
        <div className="card text-red-600">
          Failed to load categories: {error.message || 'Unknown error'}
        </div>
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
                  <input 
                    type="checkbox" 
                    checked={c.isActive} 
                    onChange={() => toggleMut.mutate(c)}
                    disabled={toggleMut.isPending}
                  /> 
                  Active
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}