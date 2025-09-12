import jwt from 'jsonwebtoken';
import { config } from '../config';

export type JwtPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}