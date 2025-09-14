'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Compass, LogIn, UserPlus } from 'lucide-react';
import { useMe } from '@/hooks/useMe';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { data: me, isLoading } = useMe();

  const NavLinks = () => (
    <div className="flex items-center gap-4">
      <Link href="/" className="hover:text-brand-700">Home</Link>
      <Link href="/explore" className="hover:text-brand-700 inline-flex items-center gap-1">
        <Compass size={16}/> Explore
      </Link>
    </div>
  );

  const AuthLinks = () =>
    isLoading ? (
      <span className="text-sm text-slate-500">…</span>
    ) : me ? (
      <div className="flex items-center gap-3">
        <span className="text-sm">Hello, <b>{me.name.split(' ')[0]}</b></span>
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
      <div className="flex items-center gap-3">
        <Link href="/login" className="btn-outline inline-flex items-center gap-1">
          <LogIn size={16}/> Login
        </Link>
        <Link href="/register" className="btn inline-flex items-center gap-1">
          <UserPlus size={16}/> Register
        </Link>
      </div>
    );

  return (
    <header className="sticky top-0 z-40">
      <div className="container my-3 flex items-center justify-between rounded-2xl bg-white/70 p-3 shadow-soft backdrop-blur">
        <Link href="/" className="text-lg font-semibold">
          <span className="text-brand-700">Saha</span>yak
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
          <AuthLinks />
        </div>

        <button className="md:hidden rounded-xl border border-slate-200 p-2" onClick={() => setOpen((v) => !v)}>
          {open ? <X/> : <Menu/>}
        </button>
      </div>

      {/* Mobile tray */}
      {open && (
        <div className="container animate-fadeUp md:hidden">
          <div className="card flex flex-col gap-4">
            <NavLinks />
            <div className="border-t pt-3">
              <AuthLinks />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}