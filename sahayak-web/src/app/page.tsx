'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Toggle from '@/components/Toggle';

export default function HomePage() {
  return (
    <section className="mt-6 grid gap-8 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .35 }}
        className="card"
      >
        <h1 className="text-3xl font-semibold leading-tight">
          Find trusted <span className="text-brand-700">providers</span> & local
          <br /> businesses near you
        </h1>
        <p className="mt-2 text-slate-600">
          Book appointments, compare listings, and get things done—fast.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/explore" className="btn">Explore services</Link>
          <Link href="/register" className="btn-outline">Become a provider</Link>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-lavender/50 p-3">
          <span className="text-sm text-slate-700">On-site only</span>
          <Toggle label="On-site filter" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: .98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: .3 }}
        className="rounded-2xl bg-gradient-to-br from-brand-100 via-brand-200 to-brand-50 p-6 shadow-soft"
      >
        <div className="rounded-xl bg-white/80 p-5 backdrop-blur">
          <h2 className="text-xl font-semibold">Popular categories</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            {['Barber', 'Electrician', 'Plumber', 'Carpenter', 'Grocery', 'Cleaning'].map((x) => (
              <li key={x}>
                <Link
                  href={`/explore?cat=${encodeURIComponent(x.toLowerCase())}`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-brand-300 hover:shadow-soft"
                >
                  {x}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}