/* Seed script for Sahayak MVP */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../db';
import { logger } from '../utils/logger';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { ProviderProfile } from '../models/ProviderProfile';
import { Business } from '../models/Business';
import { Listing } from '../models/Listing';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Appointment } from '../models/Appointment';
import { Review } from '../models/Review';
import { SupportArticle } from '../models/Support';
 
type Id = mongoose.Types.ObjectId;
const d = (lng: number, lat: number) => ({ type: 'Point', coordinates: [lng, lat] as [number, number] });
const jitter = (v: number, amt = 0.01) => v + (Math.random() - 0.5) * amt;
 
// Base: Connaught Place, New Delhi
const BASE = { lat: 28.6315, lng: 77.2167 };
 
async function main() {
  const RESET = process.argv.includes('--reset');
  await connectDB();
 
  if (RESET) {
    logger.warn('Dropping database (DEV only)…');
    await mongoose.connection.dropDatabase();
  }
 
  // 1) Categories
  const catNames = ['Barber', 'Electrician', 'Plumber', 'Carpenter', 'Grocery', 'Cleaning'] as const;
  const catsMap = new Map<string, Id>();
  for (const name of catNames) {
    const slug = name.toLowerCase();
    const cat = await Category.findOneAndUpdate(
      { slug },
      {
        name,
        slug,
        isActive: true,
        attributes: name === 'Barber'
          ? [{ key: 'durationMinutes', type: 'number', required: true }]
          : [],
      },
      { new: true, upsert: true }
    );
    catsMap.set(name, cat._id);
  }
 
  // 2) Users
  const users = [
    { name: 'Admin', email: 'admin@sahayak.dev', password: 'secret123', role: 'admin' },
    { name: 'Alice Customer', email: 'alice@sahayak.dev', password: 'secret123', role: 'customer' },
    { name: 'Bob Customer', email: 'bob@sahayak.dev', password: 'secret123', role: 'customer' },
 
    { name: 'Ivy Barber', email: 'ivy.barber@sahayak.dev', password: 'secret123', role: 'provider_individual' },
    { name: 'Sparks Electric', email: 'sparks.elec@sahayak.dev', password: 'secret123', role: 'provider_individual' },
    { name: 'FixIt Plumber', email: 'fixit.plumb@sahayak.dev', password: 'secret123', role: 'provider_individual' },
 
    { name: 'Timber Works', email: 'timber.works@sahayak.dev', password: 'secret123', role: 'provider_business' },
    { name: 'DailyFresh Grocery', email: 'dailyfresh@sahayak.dev', password: 'secret123', role: 'provider_business' },
  ] as const;
 
  const userIds: Record<string, Id> = {} as any;
  for (const u of users) {
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      u, // pre-save hook will hash password only on .save(); so do an upsert then set password + save
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (!doc.isModified('password')) {
      // ensure hashing if newly inserted
      doc.password = u.password;
      await doc.save();
    }
    userIds[u.email] = doc._id;
  }
 
  // 3) Provider profiles
  const providers = [
    {
      email: 'ivy.barber@sahayak.dev',
      displayName: 'Ivy the Barber',
      bio: '10+ years experience with classic and modern cuts.',
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
      serviceRadiusKm: 10,
      categories: [catsMap.get('Barber')!],
    },
    {
      email: 'sparks.elec@sahayak.dev',
      displayName: 'Sparks Electrician',
      bio: 'Residential wiring, appliance install, emergency calls.',
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
      serviceRadiusKm: 12,
      categories: [catsMap.get('Electrician')!],
    },
    {
      email: 'fixit.plumb@sahayak.dev',
      displayName: 'FixIt Plumber',
      bio: 'Leaks, clogs, bathroom fittings, water heaters.',
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
      serviceRadiusKm: 15,
      categories: [catsMap.get('Plumber')!],
    },
  ];
 
  for (const p of providers) {
    await ProviderProfile.findOneAndUpdate(
      { owner: userIds[p.email] },
      { owner: userIds[p.email], ...p, ownerEmail: p as any },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
 
  // 4) Business profiles
  const businesses = [
    {
      email: 'timber.works@sahayak.dev',
      name: 'Timber Works Carpentry',
      description: 'Custom furniture, repairs, modular fittings.',
      phone: '+91-9000000001',
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
      categories: [catsMap.get('Carpenter')!],
      hours: { mon: '9-6', tue: '9-6', wed: '9-6', thu: '9-6', fri: '9-6', sat: '10-4', sun: 'closed' },
    },
    {
      email: 'dailyfresh@sahayak.dev',
      name: 'DailyFresh Grocery',
      description: 'Daily essentials, fresh veggies and fruits. Home delivery.',
      phone: '+91-9000000002',
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
      categories: [catsMap.get('Grocery')!],
      hours: { mon: '8-9', tue: '8-9', wed: '8-9', thu: '8-9', fri: '8-9', sat: '8-9', sun: '8-9' },
    },
  ];
 
  for (const b of businesses) {
    await Business.findOneAndUpdate(
      { owner: userIds[b.email] },
      { owner: userIds[b.email], ...b },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
 
  // 5) Listings (approved + active)
  type L = Parameters<typeof Listing.create>[0];
  const listings: L[] = [
    {
      owner: userIds['ivy.barber@sahayak.dev'],
      ownerType: 'individual',
      category: catsMap.get('Barber')!,
      title: 'Men Haircut + Beard Trim',
      description: 'Classic haircut and beard shaping. Includes quick shampoo.',
      pricingType: 'fixed',
      price: 250,
      onSite: true,
      durationMinutes: 30,
      attributes: { durationMinutes: 30 },
      moderationStatus: 'approved',
      isActive: true,
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
    },
    {
      owner: userIds['sparks.elec@sahayak.dev'],
      ownerType: 'individual',
      category: catsMap.get('Electrician')!,
      title: 'Ceiling Fan Installation',
      description: 'Install/replace ceiling fan with proper balancing.',
      pricingType: 'fixed',
      price: 499,
      onSite: true,
      durationMinutes: 60,
      moderationStatus: 'approved',
      isActive: true,
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
    },
    {
      owner: userIds['fixit.plumb@sahayak.dev'],
      ownerType: 'individual',
      category: catsMap.get('Plumber')!,
      title: 'Kitchen Sink Unclogging',
      description: 'Chemical-free unclogging and cleanup.',
      pricingType: 'fixed',
      price: 399,
      onSite: true,
      durationMinutes: 45,
      moderationStatus: 'approved',
      isActive: true,
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
    },
    {
      owner: userIds['timber.works@sahayak.dev'],
      ownerType: 'business',
      category: catsMap.get('Carpenter')!,
      title: 'Custom Bookshelf (per sq ft)',
      description: 'Solid wood bookshelf, stain of your choice. On-site measurement included.',
      pricingType: 'fixed',
      price: 1200,
      onSite: true,
      moderationStatus: 'approved',
      isActive: true,
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
    },
    {
      owner: userIds['dailyfresh@sahayak.dev'],
      ownerType: 'business',
      category: catsMap.get('Grocery')!,
      title: 'Grocery Home Delivery',
      description: 'Place order online, same-day delivery in 5km radius.',
      pricingType: 'fixed',
      price: 49, // delivery fee
      onSite: false,
      moderationStatus: 'approved',
      isActive: true,
      location: d(jitter(BASE.lng), jitter(BASE.lat)),
    },
  ];
 
  const savedListings = await Listing.insertMany(listings, { ordered: false });
 
  // 6) Availability (next 7 days, 2 slots/day for on-site services)
  const slotOwners = savedListings.filter((l) => l.onSite);
  const slots: any[] = [];
  const startOfHour = (d0: Date, h: number) => {
    const d = new Date(d0);
    d.setUTCHours(h, 0, 0, 0);
    return d;
  };
  for (const l of slotOwners) {
    for (let i = 0; i < 7; i++) {
      const day = new Date();
      day.setUTCDate(day.getUTCDate() + i + 1);
      const s1 = startOfHour(day, 7 + 5); // ~12:00 IST
      const e1 = new Date(s1.getTime() + 30 * 60000);
      const s2 = startOfHour(day, 9 + 5); // ~14:00 IST
      const e2 = new Date(s2.getTime() + 30 * 60000);
      slots.push({ listingId: l._id, start: s1, end: e1, capacity: 1, bookedCount: 0, isActive: true });
      slots.push({ listingId: l._id, start: s2, end: e2, capacity: 1, bookedCount: 0, isActive: true });
    }
  }
  await AvailabilitySlot.insertMany(slots, { ordered: false });
 
  // 7) One completed booking + review for Barber listing
  const barber = savedListings.find((l) => l.title.includes('Haircut'))!;
  const oneSlot = await AvailabilitySlot.findOne({ listingId: barber._id });
  if (oneSlot) {
    // create a past appointment and mark completed
    const appt = await Appointment.create({
      slotId: oneSlot._id,
      listingId: barber._id,
      providerId: barber.owner,
      customerId: userIds['alice@sahayak.dev'],
      priceSnapshot: barber.price,
      titleSnapshot: barber.title,
      status: 'completed',
      paymentStatus: 'paid',
      paymentProvider: 'none',
      amountMinor: barber.price * 100,
      currency: 'INR',
    });
    await Review.create({
      bookingId: appt._id,
      listingId: barber._id,
      customerId: userIds['alice@sahayak.dev'],
      rating: 5,
      comment: 'Fantastic service! On time and precise.',
    });
  }
 
  // 8) Support Articles
  await SupportArticle.deleteMany({}); // clear demo
  await SupportArticle.insertMany([
    { title: 'How to book a service', body: 'Search → choose listing → pick a slot → confirm → pay (if required).', isActive: true },
    { title: 'Provider onboarding', body: 'Register, create your listing, add availability, and start getting bookings.', isActive: true },
  ]);
 
  logger.info('✅ Seed complete');
  await mongoose.disconnect();
}
 
main().catch((e) => {
  logger.error(e);
  process.exit(1);
});