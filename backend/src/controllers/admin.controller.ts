import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role, Language } from '@prisma/client';
import prisma from '../utils/prisma';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

// ─────────────────────────────────────────────────────────────────
// Zod schemas
// ─────────────────────────────────────────────────────────────────

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  region: z.string().min(1),
});

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role),
  location: locationSchema,
  language: z.nativeEnum(Language).optional().default(Language.EN),
  farmSize: z.number().positive().optional(),
  soilType: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  location: locationSchema.optional(),
  language: z.nativeEnum(Language).optional(),
  isActive: z.boolean().optional(),
});

const updateRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

const assignOfficerSchema = z.object({
  farmerIds: z.array(z.string().uuid()),
  officerId: z.string().uuid(),
});

const cooperativeSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  leaderId: z.string().uuid(),
});

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────────────

export async function getUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const role = req.query.role as Role | undefined;
    const isActiveStr = req.query.isActive as string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (role) where.role = role;
    if (isActiveStr !== undefined) where.isActive = isActiveStr === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          location: true,
          language: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: { users, total, page, limit } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/users
// ─────────────────────────────────────────────────────────────────

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
      return;
    }

    const { name, phone, password, role, location, language, farmSize, soilType } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'PHONE_TAKEN', message: 'An account with this phone number already exists.' },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, phone, passwordHash, role, location, language },
        select: { id: true, name: true, phone: true, role: true, language: true },
      });

      if (role === Role.FARMER) {
        await tx.farmer.create({
          data: { userId: newUser.id, farmSize: farmSize ?? 0, soilType: soilType ?? null },
        });
      }

      return newUser;
    });

    const tokenPayload = { id: user.id, role: user.role, phone: user.phone };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/admin/user/:id
// ─────────────────────────────────────────────────────────────────

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        location: true,
        language: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/admin/user/:id/role
// ─────────────────────────────────────────────────────────────────

export async function updateUserRole(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: parsed.data.role },
      select: { id: true, name: true, phone: true, role: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /api/admin/user/:id (soft delete)
// ─────────────────────────────────────────────────────────────────

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, data: { message: 'User deactivated.' } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/assign-officer
// ─────────────────────────────────────────────────────────────────

export async function assignOfficer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = assignOfficerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
      return;
    }

    const { farmerIds, officerId } = parsed.data;

    // Validate officer exists and has correct role
    const officer = await prisma.user.findUnique({
      where: { id: officerId },
      select: { id: true, role: true },
    });

    if (!officer || officer.role !== Role.EXTENSION_OFFICER) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OFFICER',
          message: 'Officer not found or does not have EXTENSION_OFFICER role.',
        },
      });
      return;
    }

    const result = await prisma.farmer.updateMany({
      where: { userId: { in: farmerIds } },
      data: { assignedOfficerId: officerId },
    });

    res.json({ success: true, data: { assigned: result.count, officerId } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/admin/cooperative
// ─────────────────────────────────────────────────────────────────

export async function createCooperative(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = cooperativeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
      });
      return;
    }

    const { name, region, leaderId } = parsed.data;

    // Validate leader exists with correct role
    const leader = await prisma.user.findUnique({
      where: { id: leaderId },
      select: { id: true, role: true },
    });

    if (!leader || leader.role !== Role.COOPERATIVE_LEADER) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LEADER',
          message: 'Leader not found or does not have COOPERATIVE_LEADER role.',
        },
      });
      return;
    }

    const cooperative = await prisma.cooperative.create({
      data: { name, region, leaderId },
    });

    res.status(201).json({ success: true, data: cooperative });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/audit-logs
// ─────────────────────────────────────────────────────────────────

export async function getAuditLogs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const userId = req.query.userId as string | undefined;
    const action = req.query.action as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, data: { logs, total, page, limit } });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/system-health
// ─────────────────────────────────────────────────────────────────

export async function getSystemHealth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const start = Date.now();
    let dbConnected = false;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    const latencyMs = Date.now() - start;

    const [activeUsers, totalUsers] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: {
        status: 'ok',
        database: { connected: dbConnected, latencyMs },
        activeUsers,
        totalUsers,
        lastSyncTimestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (err) {
    next(err);
  }
}
