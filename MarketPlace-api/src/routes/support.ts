import { Router } from 'express';
import { z } from 'zod';
import { SupportArticle, Ticket } from '../models/Support';
import { requireAuth } from '../middlewares/auth';
import { allowRoles } from '../middlewares/roles';
import { getPaging } from '../utils/pagination';

const router = Router();

// Public FAQ search
router.get('/faq', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter: any = { isActive: true };
    if (q) filter.$text = { $search: q };
    const { page, limit, skip } = getPaging(req.query, 20);
    const [items, total] = await Promise.all([
      SupportArticle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SupportArticle.countDocuments(filter)
    ]);
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

// Create ticket (user)
const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3),
    category: z.string().default('general'),
    message: z.string().min(1)
  })
});

router.post('/tickets', requireAuth, async (req, res, next) => {
  try {
    const { body } = createTicketSchema.parse(req);
    const t = await Ticket.create({
      userId: req.user!.id,
      subject: body.subject,
      category: body.category,
      messages: [{ senderType: 'user', text: body.message }]
    });
    res.status(201).json(t);
  } catch (e) { next(e); }
});

// My tickets
router.get('/tickets/me', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaging(req.query, 20);
    const [items, total] = await Promise.all([
      Ticket.find({ userId: req.user!.id }).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Ticket.countDocuments({ userId: req.user!.id })
    ]);
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

// Add message (user)
const messageSchema = z.object({ body: z.object({ text: z.string().min(1) }) });

router.post('/tickets/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const { body } = messageSchema.parse(req);
    const t = await Ticket.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      { $push: { messages: { senderType: 'user', text: body.text } } },
      { new: true }
    );
    if (!t) return res.status(404).json({ message: 'Not found' });
    res.json(t);
  } catch (e) { next(e); }
});

// Admin: manage FAQ & tickets
router.post('/admin/faq', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const a = await SupportArticle.create(req.body);
    res.status(201).json(a);
  } catch (e) { next(e); }
});

router.get('/admin/tickets', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const status = String(req.query.status || '');
    const filter: any = {};
    if (['open','in_progress','resolved'].includes(status)) filter.status = status;
    const { page, limit, skip } = getPaging(req.query, 20);
    const [items, total] = await Promise.all([
      Ticket.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Ticket.countDocuments(filter)
    ]);
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

router.patch('/admin/tickets/:id', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const updates: any = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.assignedTo) updates.assignedTo = req.body.assignedTo;
    const t = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!t) return res.status(404).json({ message: 'Not found' });
    res.json(t);
  } catch (e) { next(e); }
});

router.post('/admin/tickets/:id/messages', requireAuth, allowRoles('admin'), async (req, res, next) => {
  try {
    const { body } = messageSchema.parse(req);
    const t = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: { senderType: 'admin', text: body.text } }, $set: { status: 'in_progress' } },
      { new: true }
    );
    if (!t) return res.status(404).json({ message: 'Not found' });
    res.json(t);
  } catch (e) { next(e); }
});

export default router;