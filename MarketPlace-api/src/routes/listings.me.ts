import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';
import { allowRoles } from '../middlewares/roles';
import { Listing } from '../models/Listing';
import { Category } from '../models/Category';
import { getPaging } from '../utils/pagination';

const router = Router();

const createSchema = z.object({
  body: z.object({
    ownerType: z.enum(['individual','business']),
    categoryId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    media: z.array(z.string()).optional(),
    pricingType: z.enum(['fixed','hourly']).default('fixed'),
    price: z.number().nonnegative(),
    onSite: z.boolean().default(false),
    durationMinutes: z.number().int().positive().optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
    location: z.object({ lat: z.number(), lng: z.number() }).optional()
  })
});

router.post('/', requireAuth, allowRoles('provider_individual','provider_business'), async (req, res, next) => {
  try {
    const { body } = createSchema.parse(req);
    const category = await Category.findById(body.categoryId);
    if (!category) return res.status(400).json({ message: 'Invalid category' });

    const coords = body.location ? [body.location.lng, body.location.lat] : undefined;

    const doc = await Listing.create({
      owner: req.user!.id,
      ownerType: body.ownerType,
      category: body.categoryId,
      title: body.title,
      description: body.description,
      media: body.media,
      pricingType: body.pricingType,
      price: body.price,
      onSite: body.onSite,
      durationMinutes: body.durationMinutes,
      attributes: body.attributes,
      moderationStatus: 'pending',
      ...(coords ? { location: { type: 'Point', coordinates: coords } } : {})
    });

    res.status(201).json(doc);
  } catch (e) { next(e); }
});

// Basic search: only APPROVED & ACTIVE
router.get('/search', async (req, res, next) => {
  try {
    const {
      categoryId, categorySlug, q, onsite,
      lat, lng, radiusKm, minPrice, maxPrice, sort
    } = req.query as Record<string, string>;

    const filter: any = { isActive: true, moderationStatus: 'approved' };

    if (categoryId) filter.category = categoryId;
    else if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug, isActive: true });
      if (!cat) return res.json({ items: [], total: 0, page: 1, limit: 0 });
      filter.category = cat._id;
    }

    if (onsite === 'true') filter.onSite = true;
    if (minPrice) filter.price = { ...(filter.price||{}), $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price||{}), $lte: Number(maxPrice) };

    if (lat && lng && radiusKm) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radiusKm) * 1000
        }
      };
    }

    const { page, limit, skip } = getPaging(req.query, 20, 100);
    const query = Listing.find(filter);

    if (q) query.where({ $text: { $search: q } });

    switch (sort) {
      case 'price_asc': query.sort({ price: 1 }); break;
      case 'price_desc': query.sort({ price: -1 }); break;
      case 'recent': query.sort({ createdAt: -1 }); break;
      default: break; // nearest handled by $near
    }

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit),
      Listing.countDocuments(filter)
    ]);

    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

router.get('/mine', requireAuth, allowRoles('provider_individual','provider_business','admin'), async (req, res, next) => {
  try {
    const items = await Listing.find({ owner: req.user!.id }).sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const listing = await Listing.findOne({
      _id: id,
      isActive: true,
      moderationStatus: 'approved'
    }).populate('category', 'name slug');
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    res.json(listing);
  } catch (e) {
    next(e);
  }
});


// Update (owner/admin)
const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  media: z.array(z.string()).optional(),
  pricingType: z.enum(['fixed','hourly']).optional(),
  price: z.number().nonnegative().optional(),
  onSite: z.boolean().optional(),
  durationMinutes: z.number().int().positive().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const l = await Listing.findById(req.params.id);
    if (!l) return res.status(404).json({ message: 'Not found' });
    const isOwner = String(l.owner) === req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    if (body.location) (body as any).location = { type: 'Point', coordinates: [body.location.lng, body.location.lat] as [number, number] };
    Object.assign(l, body);
    await l.save();
    res.json({ item: l });
  } catch (e) { next(e); }
});

export default router;