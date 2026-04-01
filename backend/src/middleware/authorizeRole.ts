import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

/**
 * Middleware factory: authorizeRole
 * Must be used AFTER authenticateJWT.
 * Returns 403 if the authenticated user's role is not in the allowed list.
 *
 * @param roles - Array of permitted Role values
 */
export function authorizeRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access this resource.',
        },
      });
      return;
    }
    next();
  };
}
