import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import authRoutes from './routes/auth.routes';
import advisoryRoutes from './routes/advisory.routes';
import pestRoutes from './routes/pest.routes';
import financeRoutes from './routes/finance.routes';
import syncRoutes from './routes/sync.routes';
import notificationRoutes from './routes/notification.routes';
import officerRoutes from './routes/officer.routes';
import cooperativeRoutes from './routes/cooperative.routes';
import adminRoutes from './routes/admin.routes';
import { rateLimiter, auditLogger, errorHandler } from './middleware';

const app = express();

// ─────────────────────────────────────────────────────────────────
// Security & transport middleware
// ─────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter: 100 requests per 15 minutes per IP
app.use(rateLimiter);

// Audit logger: non-blocking write to AuditLog on mutating requests
app.use(auditLogger);

// ─────────────────────────────────────────────────────────────────
// Health check (unauthenticated)
// ─────────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ─────────────────────────────────────────────────────────────────
// API routes
// ─────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/pest', pestRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/cooperative', cooperativeRoutes);
app.use('/api/admin', adminRoutes);

// ─────────────────────────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' },
  });
});

// ─────────────────────────────────────────────────────────────────
// Global error handler (must be last, 4-param signature)
// ─────────────────────────────────────────────────────────────────

app.use(errorHandler);

export default app;
