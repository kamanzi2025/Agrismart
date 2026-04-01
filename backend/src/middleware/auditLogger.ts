import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Strips sensitive fields from a request body snapshot before logging.
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'passwordHash', 'pin', 'secret', 'token', 'refreshToken'];
  for (const key of sensitiveKeys) {
    if (key in sanitized) sanitized[key] = '[REDACTED]';
  }
  return sanitized;
}

/**
 * Derives a human-readable action string from the HTTP method + path.
 * e.g. POST /api/auth/register → "POST /api/auth/register"
 */
function buildAction(req: Request): string {
  return `${req.method} ${req.path}`;
}

/**
 * Extracts the primary resource type from the path.
 * e.g. /api/advisory/planting → "advisory"
 *      /api/pest/report/123   → "pest"
 */
function extractResourceType(req: Request): string {
  // path looks like /api/<resourceType>/...
  const segments = req.path.replace(/^\/api\//, '').split('/');
  return segments[0] ?? 'unknown';
}

/**
 * Middleware: auditLogger
 * Writes an AuditLog entry after every successful mutating request (POST/PUT/PATCH/DELETE).
 * Uses setImmediate so it never blocks or fails the response.
 * Only logs when req.user is present (authenticated routes).
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  if (!AUDITED_METHODS.has(req.method)) {
    next();
    return;
  }

  // Hook into response finish event (after headers + body flushed)
  res.on('finish', () => {
    // Only log successful responses (2xx / 3xx)
    if (res.statusCode >= 400) return;
    // Only log authenticated requests
    if (!req.user) return;

    const userId = req.user.id;
    const action = buildAction(req);
    const resourceType = extractResourceType(req);
    const resourceId = req.params.id ?? req.params.farmerId ?? 'N/A';
    const metadata: Prisma.InputJsonValue = {
      body: sanitizeBody((req.body as Record<string, unknown>) ?? {}) as Prisma.InputJsonValue,
      ip: req.ip ?? null,
      statusCode: res.statusCode,
    };

    // Non-blocking: write audit log asynchronously
    setImmediate(() => {
      prisma.auditLog
        .create({
          data: { userId, action, resourceType, resourceId, metadata },
        })
        .catch((err: unknown) => {
          // Never crash the app over an audit failure
          console.error('[AuditLog] Failed to write audit entry:', err);
        });
    });
  });

  next();
}
