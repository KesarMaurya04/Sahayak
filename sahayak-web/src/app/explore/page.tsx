'use client';
 
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { qs } from '@/lib/url';
import FiltersBar, { Filters } from '@/components/FiltersBar';
import ListingCard from '@/components/ListingCard';
 
type Listing = { _id: string; title: string; price: number; avgRating?: number; onSite?: boolean };
type SearchResp = { items: Listing[]; total?: number; page?: number; limit?: number };
 
export default function ExplorePage() {
  const router = useRouter();
  const sp = useSearchParams();
 
  // read filters from URL
  const initial: Partial<Filters> = useMemo(() => {
    const getNum = (k: string) => {
      const v = sp.get(k);
      return v ? Number(v) : undefined;
    };
    return {
      q: sp.get('q') || undefined,
      categoryId: sp.get('categoryId') || undefined,
      onsite: sp.get('onsite') === 'true' ? true : undefined,
      minPrice: getNum('minPrice'),
      maxPrice: getNum('maxPrice'),
      sort: (sp.get('sort') as Filters['sort']) || 'relevance',
      lat: getNum('lat'),
      lng: getNum('lng'),
      radiusKm: getNum('radiusKm'),
    };
  }, [sp]);
 
  // Build query string for backend
  const query = useMemo(() => {
    return qs({
      q: initial.q,
      categoryId: initial.categoryId,
      onsite: initial.onsite,
      minPrice: initial.minPrice,
      maxPrice: initial.maxPrice,
      sort: initial.sort !== 'relevance' ? initial.sort : undefined,
      lat: initial.lat,
      lng: initial.lng,
      radiusKm: initial.radiusKm,
      limit: 20,
    });
  }, [initial]);
 
const { data, isFetching } = useQuery<Listing[]>({
  queryKey: ['search', query],
  queryFn: async () => {
    const r = await apiFetch<SearchResp>(`/api/listings/search${query}`);
    return r.items ?? [];
  },
  placeholderData: [],
  staleTime: 5000, // optional, keeps data fresh for 5 seconds
});


 
  const apply = (f: Partial<Filters>) => {
    // update URL (client side)
    const next = qs({
      q: f.q,
      categoryId: f.categoryId,
      onsite: f.onsite,
      minPrice: f.minPrice,
      maxPrice: f.maxPrice,
      sort: f.sort && f.sort !== 'relevance' ? f.sort : undefined,
      lat: f.lat,
      lng: f.lng,
      radiusKm: f.radiusKm,
    });
    router.replace(`/explore${next}`);
  };
 
  return (
    <section className="space-y-4">
      <FiltersBar initial={initial} onApply={apply} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Explore</h1>
        <span className="text-sm text-slate-500">{isFetching ? 'Searching…' : `${data?.length ?? 0} results`}</span>
      </div>
 
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data?.map((l, i) => <ListingCard key={l._id} item={l} index={i} />)}
        {!isFetching && (data?.length ?? 0) === 0 && (
          <p className="text-slate-500">No results — try a different keyword or widen filters.</p>
        )}
      </div>
    </section>
  );
}