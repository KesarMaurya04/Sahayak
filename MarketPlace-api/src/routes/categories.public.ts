import { Router, Request, Response } from 'express';
import { Category } from '../models/Category';
import { cacheGet, cacheSet } from '../redis';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const parent = req.query.parent as string | undefined;
  const q: any = { isActive: true };
  if (parent === 'root') q.parent = null;
  else if (parent) q.parent = parent;

  const cacheKey = `cats:${parent ?? 'all'}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const cats = await Category.find().sort({ createdAt: -1 });
  await cacheSet(cacheKey, cats, 60); // cache 60s
  res.json(cats);
});

router.get('/slug/:slug', async (req: Request, res: Response) => {
  const key = `cat:slug:${req.params.slug}`;
  const cached = await cacheGet(key);
  if (cached) return res.json(cached);

  const cat = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!cat) return res.status(404).json({ message: 'Not found' });
  await cacheSet(key, cat, 60);
  res.json(cat);
});

export default router;