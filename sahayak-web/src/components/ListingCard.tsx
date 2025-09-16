'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import StarRating from './StarRating';
 
type Listing = {
  _id: string;
  title: string;
  price: number;
  avgRating?: number;
  onSite?: boolean;
};
 
export default function ListingCard({ item, index }: { item: Listing; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow hover:shadow-soft"
    >
      <h3 className="line-clamp-2 text-lg font-medium">{item.title}</h3>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-slate-700">₹ {item.price}</p>
        {typeof item.avgRating === 'number' && <StarRating value={item.avgRating} />}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {item.onSite && (
          <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
            On-site
          </span>
        )}
        <Link href={`/listing/${item._id}`} className="btn-outline ml-auto text-sm">
          View
        </Link>
      </div>
    </motion.article>
  );
}