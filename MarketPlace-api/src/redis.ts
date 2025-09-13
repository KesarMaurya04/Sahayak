import Redis from 'ioredis';
import { config } from './config';

export const redis = new Redis(config.redisUrl);

redis.on('connect', () => console.log('[redis] connected'));
redis.on('error', (err) => console.error('[redis] error', err));

export async function pingRedis() {
  try {
    const reply = await redis.ping();
    return reply === 'PONG';
  } catch {
    return false;
  }
}

// Small JSON cache helpers
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) as T : null;
}

export async function cacheSet(key: string, value: unknown, ttlSec: number) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
}