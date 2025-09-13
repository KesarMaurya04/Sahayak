import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';


declare module 'express-serve-static-core' {
  interface Request { user?: JwtPayload }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Prefer cookie, fall back to Bearer header
  const cookieToken = (req as any).cookies?.access_token as string | undefined;
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';

  const token = cookieToken || bearer;
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}