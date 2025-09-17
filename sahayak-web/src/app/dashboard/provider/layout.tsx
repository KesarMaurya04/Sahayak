'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useMe';
 
export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = useMe();
  const router = useRouter();
  const pathname = usePathname();
 
  useEffect(() => {
    if (!isLoading) {
      if (!me) router.replace('/login?next=/dashboard/provider');
      else if (!['provider_individual','provider_business','admin'].includes(me.role)) {
        router.replace('/');
      }
    }
  }, [me, isLoading, router]);
 
  const link = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`rounded-xl px-3 py-2 text-sm transition ${
          active ? 'bg-brand-600 text-white' : 'hover:bg-brand-50 text-slate-700'
        }`}
      >
        {label}
      </Link>
    );
  };
 
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">Provider Dashboard</div>
          <div className="text-lg font-semibold">{me?.name}</div>
        </div>
        <nav className="flex gap-2">
          {link('/dashboard/provider/listings', 'Listings')}
          {link('/dashboard/provider/availability', 'Availability')}
          {link('/dashboard/provider/bookings', 'Bookings')}
        </nav>
      </div>
      {children}
    </div>
  );
}