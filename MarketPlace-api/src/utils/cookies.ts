import { Response } from 'express';
import { config } from '../config';

const base = {
  httpOnly: true,
  sameSite: 'lax' as const, // good default; switch to 'none' if cross-site with https
  secure: config.cookieSecure,
  domain: config.cookieDomain
};

export function setAccessCookie(res: Response, token: string) {
  res.cookie('access_token', token, {
    ...base,
    maxAge: config.accessTokenTtlSec * 1000,
    path: '/'
  });
}

export function setRefreshCookie(res: Response, token: string) {
  // refresh lives longer
  res.cookie('refresh_token', token, {
    ...base,
    maxAge: config.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    path: '/api/auth' // scope to auth only (optional)
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { ...base, path: '/' });
  res.clearCookie('refresh_token', { ...base, path: '/api/auth' });
}