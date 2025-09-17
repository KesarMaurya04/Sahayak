import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import { requireAuth } from '../middlewares/auth';
import { allowRoles } from '../middlewares/roles';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Listing } from '../models/Listing';
import { getPaging } from '../utils/pagination';
import mongoose from 'mongoose';

const router = Router();

// List slots (provider view)
router.get('/listings/:listingId/slots', requireAuth, allowRoles('provider_individual','provider_business','admin'), async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaging(req.query, 50, 200);
    const { from, to } = req.query as any;
    const filter: any = { listingId: req.params.listingId };
    if (from || to) {
      filter.start = {};
      if (from) filter.start.$gte = new Date(from);
      if (to) filter.start.$lte = new Date(to);
    }
    const [items, total] = await Promise.all([
      AvailabilitySlot.find(filter).sort({ start: 1 }).skip(skip).limit(limit),
      AvailabilitySlot.countDocuments(filter)
    ]);
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

const slotSchema = z.object({
  body: z.object({
    slots: z.array(z.object({
      start: z.string().datetime(),   // ISO
      end: z.string().datetime(),
      capacity: z.number().int().min(1).max(10).default(1)
    })).min(1)
  })
});

// Create slots (provider who owns the listing; admin allowed)
router.post('/listings/:listingId/slots', requireAuth, allowRoles('provider_individual','provider_business','admin'), async (req, res, next) => {
  try {
    const { body } = slotSchema.parse(req);
    const listing = await Listing.findById(req.params.listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (req.user!.role !== 'admin' && listing.owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Not your listing' });
    }

    const docs = body.slots.map(s => ({
      listingId: listing._id,
      providerId: listing.owner,
      start: new Date(s.start),
      end: new Date(s.end),
      capacity: s.capacity
    }));
    // Upsert-like (ignore duplicates)
    const created: any[] = [];
    for (const d of docs) {
      try {
        const c = await AvailabilitySlot.create(d);
        created.push(c);
      } catch { /* duplicate -> ignore */ }
    }

    res.status(201).json({ created: created.length });
  } catch (e) { next(e); }
});

// Public: available slots window
router.get('/public/:listingId', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date();
    const to = req.query.to ? new Date(String(req.query.to)) : dayjs(from).add(30, 'day').toDate();
    const items = await AvailabilitySlot.find({
      listingId: req.params.listingId,
      isActive: true,
      start: { $gte: from, $lte: to },
      $expr: { $lt: ['$bookedCount', '$capacity'] }
    }).sort({ start: 1 }).limit(500);
    res.json({ items });
  } catch (e) { next(e); }
});

router.get('/public', async (req, res, next) => {
  try {
    const { listingId } = req.query as { listingId?: string };
    if (!listingId || !mongoose.isValidObjectId(listingId)) return res.json({ items: [] });
    const items = await AvailabilitySlot.find({ listingId, isActive: true }).sort({ start: 1 }).lean();
    res.json({ items });
  } catch (e) { next(e); }
});

// Provider: list my slots (optionally by listing)
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const { listingId } = req.query as { listingId?: string };
    const ownListings = await Listing.find({ owner: req.user!.id }).select('_id').lean();
    const ids = ownListings.map((l) => l._id);
    const q: any = { listingId: { $in: ids } };
    if (listingId && mongoose.isValidObjectId(listingId)) q.listingId = new mongoose.Types.ObjectId(listingId);
    const items = await AvailabilitySlot.find(q).sort({ start: 1 }).lean();
    res.json({ items });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  listingId: z.string().min(1),
  start: z.coerce.date(),
  end: z.coerce.date(),
  capacity: z.coerce.number().int().positive().default(1),
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const l = await Listing.findOne({ _id: body.listingId, owner: req.user!.id });
    if (!l) return res.status(403).json({ message: 'Not your listing' });
    const item = await AvailabilitySlot.create({
      listingId: l._id,
      start: body.start,
      end: body.end,
      capacity: body.capacity,
      bookedCount: 0,
      isActive: true,
    });
    res.status(201).json({ item });
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const s = await AvailabilitySlot.findById(req.params.id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    const l = await Listing.findById(s.listingId);
    if (!l || String(l.owner) !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    if ((s.bookedCount ?? 0) > 0) return res.status(400).json({ message: 'Cannot delete slot with bookings' });
    await s.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;