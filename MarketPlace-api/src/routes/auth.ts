import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User, USER_ROLES } from '../models/User';
import { signAccessToken } from '../utils/jwt';
import { validate } from '../middlewares/validate';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middlewares/auth';

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

// Register
router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body as any;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password, role });
    const token = signAccessToken({ id: user._id.toString(), email: user.email, name: user.name, role: user.role });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) { next(e); }
});

// Login
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as any;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // @ts-ignore
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signAccessToken({ id: user._id.toString(), email: user.email, name: user.name, role: user.role });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) { next(e); }
});

// Me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;