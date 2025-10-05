'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useMe';

const TABS = [
  { href: '/dashboard/admin/moderation', label: 'Moderation' },
  { href: '/dashboard/admin/categories', label: 'Categories' },
  { href: '/dashboard/admin/support',    label: 'Support'    }, 
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!me || me.role !== 'admin') router.replace('/login?next=/dashboard/admin');
  }, [me, isLoading, router]);

  if (isLoading || !me || me.role !== 'admin') {
    return <div className="card">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Admin Dashboard</div>
          <div className="text-lg font-semibold">{me.name}</div>
        </div>
        <nav className="flex gap-2">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link key={t.href} href={t.href}
                className={`rounded-xl px-3 py-2 text-sm ${active ? 'bg-brand-600 text-white' : 'hover:bg-brand-50'}`}>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}