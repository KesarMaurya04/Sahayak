import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../redis';
import { config } from '../config';

function makeLimiter(prefix: string, points: number, durationSec: number) {
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: prefix,
    points,
    duration: durationSec,
    insuranceLimiter: undefined
  });
}

const globalLimiter = makeLimiter('rl:global', config.rateLimitMax, config.rateLimitWindowSec);
const authLimiter   = makeLimiter('rl:auth',   Math.max(20, Math.floor(config.rateLimitMax / 6)), 60); // stricter on auth

async function consumeOrBlock(res: Response, limiter: RateLimiterRedis, key: string) {
  try {
    const rlRes = await limiter.consume(key);
    // Optional headers
    if (rlRes.msBeforeNext !== undefined) {
      res.setHeader('X-RateLimit-Remaining', String(rlRes.remainingPoints));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(rlRes.msBeforeNext / 1000)));
    }
    return true;
  } catch (rej: any) {
    const retryAfter = Math.ceil((rej?.msBeforeNext ?? 1000) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ message: 'Too Many Requests' });
    return false;
  }
}

export function rateLimitGlobal() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];

    const ip =
      (Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded?.split(',')[0]?.trim()) || req.ip;

    const ok = await consumeOrBlock(res, globalLimiter, ip as string);
    if (ok) next();
  };
}

export function rateLimitAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const key = `${ip}:${(req.body?.email ?? '')}`; // slow down brute-force by email
    const ok = await consumeOrBlock(res, authLimiter, key);
    if (ok) next();
  };
}