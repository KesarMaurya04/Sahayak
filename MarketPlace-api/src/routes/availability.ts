import { Router } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import { requireAuth } from '../middlewares/auth';
import { allowRoles } from '../middlewares/roles';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Listing } from '../models/Listing';
import { getPaging } from '../utils/pagination';

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

export default router;