import dotenv from 'dotenv';
dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function num(name: string, def: number) {
  const v = process.env[name];
  return v ? Number(v) : def;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 4000,
  mongoUri: required('MONGO_URI'),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean),
  jwtSecret: required('JWT_SECRET'),

  // NEW
  accessTokenTtlSec: num('ACCESS_TOKEN_TTL_SEC', 60 * 15),   // 15m
  refreshTokenTtlDays: num('REFRESH_TOKEN_TTL_DAYS', 30),    // 30d
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,      // e.g. .yourapp.com (optional in dev)
  cookieSecure: process.env.COOKIE_SECURE === 'true' || (process.env.NODE_ENV === 'production'),
  // REDIS
  redisUrl: required('REDIS_URL'),
  rateLimitWindowSec: num('RATE_LIMIT_WINDOW_SEC', 60),
  rateLimitMax: num('RATE_LIMIT_MAX', 120),
  logLevel: process.env.LOG_LEVEL ?? 'info'

};