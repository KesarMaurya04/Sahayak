import { Router } from 'express';
import { z } from 'zod';
import { SupportArticle, Ticket } from '../models/Support';
import { requireAuth } from '../middlewares/auth';
import { allowRoles } from '../middlewares/roles';
import { getPaging } from '../utils/pagination';
import mongoose from 'mongoose';

const idParam = z.object({ params: z.object({ id: z.string().min(1) }) });
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

router.get('/tickets/:id', requireAuth, async (req, res, next) => {
  try {
    const { params } = idParam.parse(req);
    if (!mongoose.isValidObjectId(params.id)) return res.status(400).json({ message: 'Invalid id' });

    const t = await Ticket.findById(params.id).lean();
    if (!t) return res.status(404).json({ message: 'Not found' });

    const isOwner = String(t.userId) === String(req.user!.id);
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    // Normalize for the frontend expected shape:
    const messages = (t.messages || []).map((m: any, idx: number) => ({
      _id: m?._id?.toString?.() ?? `${t._id}-m${idx}`,
      // frontend ChatBubble expects 'authorType' ('user' | 'agent' | 'ai')
      authorType: m?.senderType === 'admin' ? 'agent' : 'user',
      text: m?.text ?? '',
      createdAt: m?.createdAt ?? t.updatedAt ?? t.createdAt,
    }));

    const item = {
      _id: t._id,
      subject: t.subject,
      category: t.category,
      status: t.status,            // e.g., 'open' | 'in_progress' | 'resolved'
      assignedTo: t.assignedTo,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };

    // Optional AI/RAG field if you add it later:
    const ai = undefined;

    return res.json({ item, messages, ai });
  } catch (e) { next(e); }
});

// PATCH /api/support/tickets/:id/status  (owner may close/resolve their ticket)
const statusSchema = z.object({
  body: z.object({
    status: z.enum(['resolved', 'closed', 'open']).optional(),
  }),
});
router.patch('/tickets/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { params } = idParam.parse(req);
    const { body } = statusSchema.parse(req);

    const t = await Ticket.findOne({ _id: params.id, userId: req.user!.id });
    if (!t) return res.status(404).json({ message: 'Not found' });

    // Allowed customer-side transitions (tweak as you prefer)
    const allowed: Record<string, string[]> = {
      open: ['resolved', 'closed'],
      in_progress: ['resolved', 'closed'],
      resolved: ['closed', 'open'],
      closed: [],
    };
    const from = t.status || 'open';
    const to = body.status || 'resolved';

    if (!allowed[from]?.includes(to)) {
      return res.status(400).json({ message: `Cannot change status from ${from} to ${to}` });
    }

    t.status = to as any;
    await t.save();

    return res.json({ item: t });
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