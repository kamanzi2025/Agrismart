import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

/**
 * Global Express error handler.
 * Must be registered LAST in the middleware chain (4 params).
 *
 * Handles:
 *   ZodError            → 400 VALIDATION_ERROR
 *   Prisma P2002        → 409 CONFLICT  (unique constraint violation)
 *   Prisma P2025        → 404 NOT_FOUND (record not found)
 *   TokenExpiredError   → 401 TOKEN_EXPIRED
 *   JsonWebTokenError   → 401 INVALID_TOKEN
 *   Generic Error       → 500 INTERNAL_ERROR
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // ── Zod validation errors ──────────────────────────────────────
  if (err instanceof ZodError) {
    const first = err.errors[0];
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: first ? `${first.path.join('.')}: ${first.message}` : 'Validation failed.',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
    });
    return;
  }

  // ── Prisma known errors ────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      const fields = (err.meta?.target as string[])?.join(', ') ?? 'field';
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `A record with this ${fields} already exists.`,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      // Record not found (e.g. update/delete on missing row)
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'The requested record was not found.' },
      });
      return;
    }
  }

  // ── JWT errors ─────────────────────────────────────────────────
  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Access token has expired. Please refresh.' },
    });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or malformed token.' },
    });
    return;
  }

  // ── Generic / unexpected errors ────────────────────────────────
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred.';

  console.error('[ErrorHandler]', err);

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message },
  });
}
