import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, authorizeRole } from '../middleware';
import { sendSMS } from '../services/notification.service';
import prisma from '../utils/prisma';

const router = Router();

// Internal: send SMS (admin/officer only)
router.post(
  '/sms',
  authenticateJWT,
  authorizeRole([Role.ADMIN, Role.EXTENSION_OFFICER]),
  async (req, res, next) => {
    try {
      const { phone, message } = req.body as { phone?: string; message?: string };
      if (!phone || !message) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'phone and message required' },
        });
      }
      await sendSMS(phone, message);
      return res.json({ success: true, data: { message: 'SMS sent.' } });
    } catch (err) {
      next(err);
    }
  },
);

// Get notification history for farmer
router.get(
  '/history',
  authenticateJWT,
  authorizeRole([Role.FARMER]),
  async (req, res, next) => {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { action: { startsWith: 'SMS_SENT' } },
        orderBy: { timestamp: 'desc' },
        take: 20,
      });
      return res.json({ success: true, data: { notifications: logs } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
