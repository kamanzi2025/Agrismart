import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter: 100 requests per 15 minutes per IP.
 * Applied at the app level in app.ts.
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many requests. Please slow down.',
    },
  },
});

/**
 * Stricter rate limiter for auth endpoints: 10 requests per 15 minutes per IP.
 * Protects against brute-force login / register attempts.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many authentication attempts. Please wait 15 minutes.',
    },
  },
});
