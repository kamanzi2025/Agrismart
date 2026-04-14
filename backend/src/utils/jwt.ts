import jwt from 'jsonwebtoken';
import { AuthUser } from '../types';

const ACCESS_EXPIRES = '24h';
const REFRESH_EXPIRES = '7d';

function getAccessSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  return secret;
}

/**
 * In-memory refresh token store.
 * Maps token string → userId.
 * Replace with a DB-backed store (e.g. a RefreshToken table) in production.
 */
const refreshTokenStore = new Map<string, string>();

/**
 * Signs a JWT access token (24 h) for the given user payload.
 */
export function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, role: user.role, phone: user.phone },
    getAccessSecret(),
    { expiresIn: ACCESS_EXPIRES }
  );
}

/**
 * Signs a JWT refresh token (7 d) and registers it in the store.
 */
export function signRefreshToken(user: AuthUser): string {
  const token = jwt.sign(
    { id: user.id, role: user.role, phone: user.phone },
    getRefreshSecret(),
    { expiresIn: REFRESH_EXPIRES }
  );
  refreshTokenStore.set(token, user.id);
  return token;
}

/**
 * Verifies an access token and returns the decoded payload.
 * Throws if invalid or expired.
 */
export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, getAccessSecret()) as jwt.JwtPayload;
  return { id: payload.id, role: payload.role, phone: payload.phone };
}

/**
 * Verifies a refresh token, checks it exists in the store, and returns
 * the decoded payload. Returns null if invalid or not registered.
 */
export function verifyRefreshToken(token: string): AuthUser | null {
  try {
    if (!refreshTokenStore.has(token)) return null;
    const payload = jwt.verify(token, getRefreshSecret()) as jwt.JwtPayload;
    return { id: payload.id, role: payload.role, phone: payload.phone };
  } catch {
    return null;
  }
}

/**
 * Removes a refresh token from the store (logout / rotation).
 */
export function revokeRefreshToken(token: string): void {
  refreshTokenStore.delete(token);
}
