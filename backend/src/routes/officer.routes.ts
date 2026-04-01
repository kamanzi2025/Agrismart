import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, authorizeRole } from '../middleware';
import * as officer from '../controllers/officer.controller';

const router = Router();

const officerOrAdmin = [Role.EXTENSION_OFFICER, Role.ADMIN];

router.get('/farmers', authenticateJWT, authorizeRole(officerOrAdmin), officer.getFarmers);
router.get('/farmer/:id', authenticateJWT, authorizeRole(officerOrAdmin), officer.getFarmerDetail);
router.get('/pest-reports', authenticateJWT, authorizeRole(officerOrAdmin), officer.getPestReports);
router.get('/analytics', authenticateJWT, authorizeRole(officerOrAdmin), officer.getAnalytics);
router.post('/send-advisory', authenticateJWT, authorizeRole(officerOrAdmin), officer.sendAdvisory);

export default router;
