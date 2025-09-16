import { Router } from 'express';
import mongoose from 'mongoose';
import auth from './auth';
import adminCategories from './admin.categories';
import publicCategories from './categories.public';
import adminModeration from './admin.moderation';
import availability from './availability';
import bookings from './bookings';
import reviews from './reviews';
import support from './support';
import { pingRedis } from '../redis';
import aiSupport from './support.ai';
import listing from './listings.me';

const router = Router();

router.get('/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const redisStatus = await pingRedis(); // true | false | null
  res.json({
    ok: true,
    time: new Date().toISOString(),
    db: ['disconnected','connected','connecting','disconnecting'][dbState] || dbState,
    redis: redisStatus === null ? 'disabled' : (redisStatus ? 'connected' : 'down')
  });
});

router.use('/auth', auth);
router.use('/admin/categories', adminCategories);
router.use('/admin/moderation', adminModeration);
router.use('/categories', publicCategories);
router.use('/availability', availability);
router.use('/bookings', bookings);
router.use('/reviews', reviews);
router.use('/support', support);
router.use('/support/ai', aiSupport);
router.use('/listings', listing);

export default router;