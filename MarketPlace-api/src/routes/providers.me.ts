import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';

import { ProviderProfile } from '../models/ProviderProfile';
import { allowRoles } from '../middlewares/roles';

const router = Router();

const upsertSchema = z.object({
  body: z.object({
    displayName: z.string().min(1),
    bio: z.string().max(2000).optional(),
    categories: z.array(z.string()).optional(),
    address: z.string().optional(),
    location: z.object({ lat: z.number(), lng: z.number() }).optional(),
    serviceRadiusKm: z.number().min(0).max(200).optional()
  })
});

router.get('/me', requireAuth, allowRoles('provider_individual'), async (req, res) => {
  const profile = await ProviderProfile.findOne({ owner: req.user!.id });
  res.json(profile || null);
});

router.post('/me', requireAuth, allowRoles('provider_individual'), async (req, res, next) => {
  try {
    const { body } = upsertSchema.parse(req);
    const coords = body.location ? [body.location.lng, body.location.lat] : undefined;

    const profile = await ProviderProfile.findOneAndUpdate(
      { owner: req.user!.id },
      {
        owner: req.user!.id,
        displayName: body.displayName,
        bio: body.bio,
        categories: body.categories,
        address: body.address,
        ...(coords ? { location: { type: 'Point', coordinates: coords } } : {}),
        ...(body.serviceRadiusKm !== undefined ? { serviceRadiusKm: body.serviceRadiusKm } : {})
      },
      { upsert: true, new: true }
    );

    res.status(201).json(profile);
  } catch (e) { next(e); }
});

export default router;