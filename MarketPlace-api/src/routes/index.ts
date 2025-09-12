import { Router } from 'express';
import mongoose from 'mongoose';
import auth from './auth';

const router = Router();

router.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    ok: true,
    time: new Date().toISOString(),
    db: ['disconnected','connected','connecting','disconnecting'][dbState] || dbState
  });
});

router.use('/auth', auth);

export default router;