import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';
import { allowRoles } from '../middlewares/roles';
import { Business } from '../models/Business';

const router = Router();

const upsertSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().max(2000).optional(),
    categories: z.array(z.string()).optional(),
    address: z.string().optional(),
    location: z.object({ lat: z.number(), lng: z.number() }).optional(),
    phone: z.string().optional(),
    hours: z.array(z.object({
      day: z.number().min(0).max(6),
      open: z.string().optional(),
      close: z.string().optional()
    })).optional()
  })
});

router.get('/me', requireAuth, allowRoles('provider_business'), async (req, res) => {
  const biz = await Business.findOne({ owner: req.user!.id });
  res.json(biz || null);
});

router.post('/me', requireAuth, allowRoles('provider_business'), async (req, res, next) => {
  try {
    const { body } = upsertSchema.parse(req);
    const coords = body.location ? [body.location.lng, body.location.lat] : undefined;

    const biz = await Business.findOneAndUpdate(
      { owner: req.user!.id },
      {
        owner: req.user!.id,
        name: body.name,
        description: body.description,
        categories: body.categories,
        address: body.address,
        phone: body.phone,
        hours: body.hours,
        ...(coords ? { location: { type: 'Point', coordinates: coords } } : {})
      },
      { upsert: true, new: true }
    );

    res.status(201).json(biz);
  } catch (e) { next(e); }
});

export default router;