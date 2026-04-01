import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Middleware: authenticateJWT
 * Extracts the Bearer token from the Authorization header, verifies it,
 * and attaches { id, role, phone } to req.user.
 * Returns 401 if the token is missing, malformed, or expired.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'MISSING_TOKEN', message: 'Authorization token is required.' },
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err: unknown) {
    const isExpired =
      err instanceof Error && err.name === 'TokenExpiredError';

    res.status(401).json({
      success: false,
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: isExpired
          ? 'Access token has expired. Please refresh.'
          : 'Invalid or malformed token.',
      },
    });
  }
}

// authorizeRole lives in ./authorizeRole.ts — imported via middleware/index.ts
