import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/auth';
import { Appointment } from '../models/Appointment';
import { Review } from '../models/Review';
import { getPaging } from '../utils/pagination';

const router = Router();

const createSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional()
  })
});

// Create review if booking completed and owned by user
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { body } = createSchema.parse(req);
    const booking = await Appointment.findOne({ _id: body.bookingId, customerId: req.user!.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Only completed bookings can be reviewed' });

    const exists = await Review.findOne({ bookingId: booking._id });
    if (exists) return res.status(400).json({ message: 'Already reviewed' });

    const rev = await Review.create({
      bookingId: booking._id,
      listingId: booking.listingId,
      providerId: booking.providerId,
      customerId: req.user!.id,
      rating: body.rating,
      comment: body.comment
    });

    res.status(201).json(rev);
  } catch (e) { next(e); }
});

// List reviews by listing
router.get('/listing/:listingId', async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaging(req.query, 20);
    const [items, total] = await Promise.all([
      Review.find({ listingId: req.params.listingId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Review.countDocuments({ listingId: req.params.listingId })
    ]);
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

export default router;