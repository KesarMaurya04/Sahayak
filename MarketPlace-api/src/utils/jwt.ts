import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';

export type JwtPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenTtlSec });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

// Refresh token: opaque random string (not a JWT)
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex'); // 96 chars
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}