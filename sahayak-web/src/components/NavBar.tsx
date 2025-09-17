'use client';
import Link from 'next/link';
import { useMe } from '@/hooks/useMe';

export default function NavBar() {
  const { data: me } = useMe();
  const isLoggedIn = !!me;
  const isProvider = !!me && ['provider_individual','provider_business','admin'].includes(me.role);

  return (
    <header className="sticky top-0 z-40 mb-4 border-b border-slate-100 bg-white/70 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="font-semibold text-brand-700">Sahayak</Link>

        <nav className="flex items-center gap-3">
          <Link className="hover:text-brand-700 text-sm" href="/explore">Explore</Link>
          {isLoggedIn && <Link className="hover:text-brand-700 text-sm" href="/dashboard/provider/bookings">Bookings</Link>}
          {isProvider && <Link className="hover:text-brand-700 text-sm" href="/dashboard/provider">Dashboard</Link>}

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm">Hi, <b>{me.name?.split(' ')[0] || 'You'}</b></span>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                  location.href = '/';
                }}
                className="btn !py-1 !px-3"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link className="btn-outline !py-1 !px-3 text-sm" href="/login">Login</Link>
              <Link className="btn !py-1 !px-3 text-sm" href="/register">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}