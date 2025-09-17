// src/app/dashboard/provider/listings/new/page.tsx
'use client';
 
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useMe } from '@/hooks/useMe';
 
type Category = { _id: string; name: string; slug: string; parent?: string | null; isActive?: boolean };
 
const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  pricingType: z.enum(['fixed', 'hourly']).default('fixed'),
  price: z.coerce.number().positive('Price must be > 0'),
  onSite: z.boolean().optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});
 
type FormData = z.infer<typeof schema>;
 
export default function NewListingPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const [usingGeo, setUsingGeo] = useState(false);
 
  // Fetch categories
  const { data: categoriesResp, isLoading: loadingCats, error: catsError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => apiFetch<{ items: Category[] }>('/api/categories'),
  });
  const categories = categoriesResp?.items ?? [];
 
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: { pricingType: 'fixed' } as Partial<FormData>,
    mode: 'onSubmit',
  });
 
  // Preselect first category once loaded (if none chosen)
  const categoryId = watch('categoryId');
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setValue('categoryId', categories[0]._id, { shouldValidate: true });
    }
  }, [categories, categoryId, setValue]);
 
  const useMyLocation = async () => {
    if (!navigator.geolocation) return;
    setUsingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('lat', Number(pos.coords.latitude));
        setValue('lng', Number(pos.coords.longitude));
        setUsingGeo(false);
      },
      () => setUsingGeo(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };
 
  const onSubmit: SubmitHandler<FormData> = async (v) => {
    const ownerType = me?.role === 'provider_business' ? 'business' : 'individual';
    const payload: any = {
      ownerType,
      title: v.title,
      description: v.description,
      categoryId: v.categoryId,
      pricingType: v.pricingType,
      price: v.price,
      onSite: !!v.onSite,
      durationMinutes: v.durationMinutes,
      attributes: v.durationMinutes ? { durationMinutes: v.durationMinutes } : undefined,
      location: v.lat && v.lng ? { lat: v.lat, lng: v.lng } : undefined,
    };
    await apiFetch('/api/listings', { method: 'POST', json: payload });
    router.push('/dashboard/provider/listings');
  };
 
  return (
    <div className="mx-auto max-w-2xl card">
      <h1 className="mb-4 text-xl font-semibold">New Listing</h1>
 
      {catsError ? (
        <p className="text-red-600">Failed to load categories.</p>
      ) : loadingCats && categories.length === 0 ? (
        <p className="text-slate-600">Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className="text-slate-600">No categories yet. Ask admin to add one.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Title</label>
            <input className="input" {...register('title')} />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>
 
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm">Description</label>
            <textarea className="input" rows={4} {...register('description')} />
          </div>
 
          <div>
            <label className="mb-1 block text-sm">Category</label>
            <select className="input" {...register('categoryId')}>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-sm text-red-600">{errors.categoryId.message}</p>}
          </div>
 
          <div>
            <label className="mb-1 block text-sm">Pricing</label>
            <select className="input" {...register('pricingType')}>
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
 
          <div>
            <label className="mb-1 block text-sm">Price (₹)</label>
            <input className="input" inputMode="numeric" {...register('price', { valueAsNumber: true })} />
            {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
          </div>
 
          <div>
            <label className="mb-1 block text-sm">Duration (minutes)</label>
            <input className="input" inputMode="numeric" {...register('durationMinutes', { valueAsNumber: true })} />
          </div>
 
          <div className="sm:col-span-2 flex items-center gap-2">
            <input id="onsite" type="checkbox" {...register('onSite')} />
            <label htmlFor="onsite">On-site service (uses location below)</label>
          </div>
 
          <div>
            <label className="mb-1 block text-sm">Latitude</label>
            <input className="input" inputMode="numeric" {...register('lat', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Longitude</label>
            <input className="input" inputMode="numeric" {...register('lng', { valueAsNumber: true })} />
          </div>
 
          <div className="sm:col-span-2 flex items-center gap-2">
            <button type="button" className="btn-outline" onClick={useMyLocation} disabled={usingGeo}>
              {usingGeo ? 'Locating…' : 'Use my location'}
            </button>
            <button disabled={isSubmitting} className="btn ml-auto">
              {isSubmitting ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}