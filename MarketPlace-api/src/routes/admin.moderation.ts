import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';
import { allowRoles } from '../middlewares/roles';
import { Listing } from '../models/Listing';
import { getPaging } from '../utils/pagination';

const router = Router();

router.get('/listings', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const filter: any = {};
    if (['pending','approved','rejected'].includes(status)) filter.moderationStatus = status;

    const { page, limit, skip } = getPaging(req.query, 20);
    const [items, total] = await Promise.all([
      Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Listing.countDocuments(filter)
    ]);
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

const patchSchema = z.object({
  body: z.object({
    status: z.enum(['approved','rejected']),
    note: z.string().optional()
  })
});

router.patch('/listings/:id', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const { body } = patchSchema.parse(req);
    const doc = await Listing.findByIdAndUpdate(
      req.params.id,
      { moderationStatus: body.status, moderationNote: body.note },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
});

export default router;