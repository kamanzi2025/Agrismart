import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '../utils/prisma';

const BYPASS_ROLES: Role[] = [Role.ADMIN, Role.EXTENSION_OFFICER, Role.COOPERATIVE_LEADER];

/** Roles that bypass ownership checks and can access any farmer's data */
function canBypass(role: string): boolean {
  return BYPASS_ROLES.includes(role as Role);
}

/**
 * Middleware: ownershipGuard (param-based)
 * Checks that req.params.farmerId === req.user.id.
 * ADMIN / EXTENSION_OFFICER / COOPERATIVE_LEADER bypass this check.
 * Use when the route param directly identifies the owner (e.g. /api/farmer/:farmerId/records).
 */
export function ownershipGuardParam(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
    });
    return;
  }

  if (canBypass(req.user.role)) {
    next();
    return;
  }

  const paramFarmerId = req.params.farmerId ?? req.params.id;
  if (paramFarmerId && paramFarmerId !== req.user.id) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only access your own data.' },
    });
    return;
  }

  next();
}

/**
 * Middleware factory: ownershipGuardDB
 * Performs a DB lookup to confirm the resource belongs to req.user.id.
 * Use when you need to verify ownership of a specific record (e.g. advisory, pest report).
 *
 * @param resourceType - 'advisory' | 'pestReport' | 'financialRecord'
 */
export function ownershipGuardDB(resourceType: 'advisory' | 'pestReport' | 'financialRecord') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
      });
      return;
    }

    if (canBypass(req.user.role)) {
      next();
      return;
    }

    const { id } = req.params;
    if (!id) {
      next();
      return;
    }

    try {
      let farmerId: string | null = null;

      if (resourceType === 'advisory') {
        const record = await prisma.advisory.findUnique({
          where: { id },
          select: { farmerId: true },
        });
        farmerId = record?.farmerId ?? null;
      } else if (resourceType === 'pestReport') {
        const record = await prisma.pestReport.findUnique({
          where: { id },
          select: { farmerId: true },
        });
        farmerId = record?.farmerId ?? null;
      } else if (resourceType === 'financialRecord') {
        const record = await prisma.financialRecord.findUnique({
          where: { id },
          select: { farmerId: true },
        });
        farmerId = record?.farmerId ?? null;
      }

      if (!farmerId) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Resource not found.' },
        });
        return;
      }

      if (farmerId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only access your own data.' },
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
