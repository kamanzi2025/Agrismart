import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, authorizeRole } from '../middleware';
import * as cooperative from '../controllers/cooperative.controller';

const router = Router();

const leaderOrAdmin = [Role.COOPERATIVE_LEADER, Role.ADMIN];

router.get('/overview', authenticateJWT, authorizeRole(leaderOrAdmin), cooperative.getOverview);
router.get('/trends', authenticateJWT, authorizeRole(leaderOrAdmin), cooperative.getTrends);
router.get('/members', authenticateJWT, authorizeRole(leaderOrAdmin), cooperative.getMembers);
router.get(
  '/report/:season',
  authenticateJWT,
  authorizeRole(leaderOrAdmin),
  cooperative.getReport,
);

export default router;
