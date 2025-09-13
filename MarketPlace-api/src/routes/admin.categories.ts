import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/auth';
import { allowRoles } from '../middlewares/roles';

const router = Router();

// simple slugify without deps
function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const attrSchema = z.object({
  key: z.string().min(1),
  type: z.enum(['string','number','boolean','enum']),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional()
});

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    slug: z.string().optional(),           // optional; derive from name
    parentId: z.string().optional(),
    attributes: z.array(attrSchema).optional(),
    isActive: z.boolean().optional()
  })
});

const updateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    parentId: z.string().optional().nullable(),
    attributes: z.array(attrSchema).optional(),
    isActive: z.boolean().optional()
  })
});

// Create
router.post('/', requireAuth, allowRoles('admin'), validate(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, parentId, attributes, isActive } = req.body as any;
    const s = slug ? slug : slugify(name);

    let path: string[] = [];
    let parent = null;
    if (parentId) {
      parent = await Category.findById(parentId);
      if (!parent) return res.status(400).json({ message: 'Invalid parentId' });
      path = [ ...(parent.path as any[]), parent._id.toString() ];
    }

    const cat = await Category.create({
      name,
      slug: s,
      parent: parent ? parent._id : null,
      path,
      attributes: attributes || [],
      isActive: isActive ?? true,
      createdBy: req.user?.id
    });

    res.status(201).json(cat);
  } catch (e) { next(e); }
});

// Update
router.patch('/:id', requireAuth, allowRoles('admin'), validate(updateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, slug, parentId, attributes, isActive } = req.body as any;

    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    if (typeof name === 'string') cat.name = name;
    if (typeof slug === 'string') cat.slug = slug;
    if (Array.isArray(attributes)) (cat as any).attributes = attributes;
    if (typeof isActive === 'boolean') cat.isActive = isActive;

    if (parentId !== undefined) {
      if (parentId === null) {
        cat.parent = null as any;
        cat.path = [];
      } else {
        const parent = await Category.findById(parentId);
        if (!parent) return res.status(400).json({ message: 'Invalid parentId' });
        cat.parent = parent._id as any;
        (cat as any).path = [ ...(parent.path as any[]), parent._id ];
      }
    }

    await cat.save();
    res.json(cat);
  } catch (e) { next(e); }
});

// List (admin view, includes inactive)
router.get('/', requireAuth, allowRoles('admin'), async (_req: Request, res: Response) => {
  const cats = await Category.find().sort({ createdAt: -1 });
  res.json(cats);
});

export default router;