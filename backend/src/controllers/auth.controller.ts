import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role, Language } from '@prisma/client';
import prisma from '../utils/prisma';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from '../utils/jwt';

// ─────────────────────────────────────────────────────────────────
// Zod schemas
// ─────────────────────────────────────────────────────────────────

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  region: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(7, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role),
  location: locationSchema,
  language: z.nativeEnum(Language).optional().default(Language.EN),
  // FARMER-only optional fields
  farmSize: z.number().positive().optional(),
  soilType: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────

/**
 * Register any user type. Creates a User record and, if role is FARMER,
 * also creates a linked Farmer record. Returns access + refresh tokens.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
    });
    return;
  }

  const { name, phone, password, role, location, language, farmSize, soilType } = parsed.data;

  // Check for duplicate phone
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    res.status(409).json({
      success: false,
      error: { code: 'PHONE_TAKEN', message: 'An account with this phone number already exists.' },
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create user (+ farmer in a transaction if needed)
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        phone,
        passwordHash,
        role,
        location,
        language,
      },
      select: { id: true, name: true, phone: true, role: true, language: true },
    });

    if (role === Role.FARMER) {
      await tx.farmer.create({
        data: {
          userId: newUser.id,
          farmSize: farmSize ?? 0,
          soilType: soilType ?? null,
        },
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
}

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────

/**
 * Authenticate with phone + password. Returns access + refresh tokens.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
    });
    return;
  }

  const { phone, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, name: true, phone: true, role: true, passwordHash: true, isActive: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Phone number or password is incorrect.' },
    });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated.' },
    });
    return;
  }

  const tokenPayload = { id: user.id, role: user.role, phone: user.phone };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      accessToken,
      refreshToken,
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────

/**
 * Exchange a valid refresh token for a new access token.
 * Implements refresh token rotation: old token is revoked, new one issued.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
    });
    return;
  }

  const { refreshToken } = parsed.data;
  const user = verifyRefreshToken(refreshToken);

  if (!user) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or expired.' },
    });
    return;
  }

  // Rotate: revoke old, issue new pair
  revokeRefreshToken(refreshToken);
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  res.json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
}

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────

/**
 * Invalidate the provided refresh token (logout).
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const parsed = logoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message },
    });
    return;
  }

  revokeRefreshToken(parsed.data.refreshToken);

  res.json({
    success: true,
    data: { message: 'Logged out successfully.' },
  });
}
