import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User, USER_ROLES } from '../models/User';
import { signAccessToken, generateRefreshToken, hashToken } from '../utils/jwt';
import { validate } from '../middlewares/validate';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middlewares/auth';
import { setAccessCookie, setRefreshCookie, clearAuthCookies } from '../utils/cookies';
import { RefreshToken } from '../models/RefreshToken';
import { config } from '../config';
import { rateLimitAuth } from '../middlewares/rateLimit';
import crypto from 'crypto';
import { PasswordReset } from '../models/PasswordReset';
import { sendPasswordResetEmail } from '../services/email';

const router = Router();

// Schemas
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(USER_ROLES).default('customer')
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

// Helpers
async function issueSession(res: Response, user: any) {
  const access = signAccessToken({ id: user._id.toString(), email: user.email, name: user.name, role: user.role });
  const refresh = generateRefreshToken();
  const refreshHash = hashToken(refresh);
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await RefreshToken.create({ userId: user._id, tokenHash: refreshHash, expiresAt });

  setAccessCookie(res, access);
  setRefreshCookie(res, refresh);
}

// Register
router.post('/register', rateLimitAuth(), validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body as any;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password, role });
    await issueSession(res, user);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
      // tokens are in cookies; we don't return them in body
    });
  } catch (e) { next(e); }
});

// Login
router.post('/login', rateLimitAuth(), validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as any;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // @ts-ignore
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    await issueSession(res, user);

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) { next(e); }
});

// Refresh access token (rotate refresh token)
router.post('/refresh', rateLimitAuth(), async (req: Request, res: Response) => {
  const refresh = (req as any).cookies?.refresh_token as string | undefined;
  if (!refresh) return res.status(401).json({ message: 'Missing refresh token' });

  const refreshHash = hashToken(refresh);
  const record = await RefreshToken.findOne({ tokenHash: refreshHash });
  if (!record) return res.status(401).json({ message: 'Invalid refresh token' });
  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne().catch(() => {});
    return res.status(401).json({ message: 'Expired refresh token' });
  }

  // Load user
  const user = await User.findById(record.userId);
  if (!user) {
    await record.deleteOne().catch(() => {});
    return res.status(401).json({ message: 'Unknown user' });
  }

  // rotate: delete old, issue new
  await record.deleteOne().catch(() => {});
  await issueSession(res, user);

  res.json({ ok: true });
});

// Logout
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  // Try to revoke current refresh token
  const refresh = (req as any).cookies?.refresh_token as string | undefined;
  if (refresh) {
    const refreshHash = hashToken(refresh);
    await RefreshToken.findOneAndDelete({ tokenHash: refreshHash }).catch(() => {});
  }
  clearAuthCookies(res);
  res.json({ ok: true });
});

const emailSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(6),
});

// POST /api/auth/forgot-password
router.post('/auth/forgot-password', async (req, res, next) => {
  try {
    const { email } = emailSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select('_id name email');
    // Always return ok to avoid user enumeration
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

      await PasswordReset.deleteMany({ userId: user._id, email: user.email }); // one active token per user
      await PasswordReset.create({ userId: user._id, email: user.email, tokenHash, expiresAt });

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const link = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
      await sendPasswordResetEmail(user.email, user.name || 'there', link);
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/auth/reset-password
router.post('/auth/reset-password', async (req, res, next) => {
  try {
    const { email, token, password } = resetSchema.parse(req.body);
    const rec = await PasswordReset.findOne({ email: email.toLowerCase() });
    if (!rec) return res.status(400).json({ message: 'Invalid or expired token' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (rec.tokenHash !== tokenHash || rec.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(rec.userId).select('+password');
    if (!user) return res.status(400).json({ message: 'User not found' });

    user.password = password; // pre-save hook hashes
    await user.save();

    // Clean up tokens / sessions
    await PasswordReset.deleteMany({ userId: rec.userId });
    await RefreshToken.deleteMany({ userId: rec.userId });

    res.json({ ok: true });
  } catch (e) { next(e); }
});



// Me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;