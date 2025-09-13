import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';
import { AvailabilitySlot } from '../models/AvailabilitySlot';
import { Listing } from '../models/Listing';
import { Appointment } from '../models/Appointment';
import { getPaging } from '../utils/pagination';
import { sendEmail } from '../services/email';

const router = Router();

// Create a booking atomically (capacity check)
const createSchema = z.object({
  body: z.object({
    listingId: z.string().min(1),
    slotId: z.string().min(1)
  })
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { body } = createSchema.parse(req);
    const listing = await Listing.findById(body.listingId);
    if (!listing || listing.moderationStatus !== 'approved') return res.status(400).json({ message: 'Invalid listing' });

    // atomically increment bookedCount if capacity available
    const slot = await AvailabilitySlot.findOneAndUpdate(
      { _id: body.slotId, listingId: listing._id, $expr: { $lt: ['$bookedCount', '$capacity'] } },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );
    if (!slot) return res.status(409).json({ message: 'Slot is full or unavailable' });

    const appt = await Appointment.create({
      slotId: slot._id,
      listingId: listing._id,
      providerId: listing.owner,
      customerId: req.user!.id,
      priceSnapshot: listing.price,
      titleSnapshot: listing.title,
      status: 'pending'
    });

    // notifications (best-effort)
    sendEmail(req.user!.email, 'Booking created', 'Your booking for <b>${listing.title}</b> is pending.');
    // Provider email would require provider email lookup; omitted for brevity.

    res.status(201).json(appt);
  } catch (e) { next(e); }
});

// My bookings (customer)
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaging(req.query, 20);
    const [items, total] = await Promise.all([
      Appointment.find({ customerId: req.user!.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Appointment.countDocuments({ customerId: req.user!.id })
    ]);
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

// Provider bookings (provider)
router.get('/provider', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaging(req.query, 20);
    const [items, total] = await Promise.all([
      Appointment.find({ providerId: req.user!.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Appointment.countDocuments({ providerId: req.user!.id })
    ]);
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

const idSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

// Customer cancel
router.patch('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { params } = idSchema.parse(req);
    const appt = await Appointment.findOne({ _id: params.id, customerId: req.user!.id });
    if (!appt) return res.status(404).json({ message: 'Not found' });
    if (appt.status === 'canceled' || appt.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel ${appt.status}' });
    }
    appt.status = 'canceled';
    await appt.save();
    await AvailabilitySlot.findByIdAndUpdate(appt.slotId, { $inc: { bookedCount: -1 } });

    sendEmail(req.user!.email, 'Booking canceled', 'Your booking "${appt.titleSnapshot}" was canceled.');
    res.json(appt);
  } catch (e) { next(e); }
});

// Provider confirm
router.patch('/:id/confirm', requireAuth, async (req, res, next) => {
  try {
    const { params } = idSchema.parse(req);
    const appt = await Appointment.findOne({ _id: params.id, providerId: req.user!.id });
    if (!appt) return res.status(404).json({ message: 'Not found' });
    if (appt.status !== 'pending') return res.status(400).json({ message: 'Only pending can be confirmed' });
    appt.status = 'confirmed';
    await appt.save();
    res.json(appt);
  } catch (e) { next(e); }
});

// Provider complete
router.patch('/:id/complete', requireAuth, async (req, res, next) => {
  try {
    const { params } = idSchema.parse(req);
    const appt = await Appointment.findOne({ _Id: params.id, providerId: req.user!.id });
    // typo fix: correct field is _id
    const appt2 = await Appointment.findOne({ _id: params.id, providerId: req.user!.id });
    const apptDoc = appt2;
    if (!apptDoc) return res.status(404).json({ message: 'Not found' });
    if (!['confirmed','pending'].includes(apptDoc.status)) return res.status(400).json({ message: 'Cannot complete' });
    apptDoc.status = 'completed';
    await apptDoc.save();
    res.json(apptDoc);
  } catch (e) { next(e); }
});

export default router;