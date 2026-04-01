import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, authorizeRole, ownershipGuardDB } from '../middleware';
import * as advisory from '../controllers/advisory.controller';

const router = Router();

router.get('/planting', authenticateJWT, authorizeRole([Role.FARMER]), advisory.getPlantingAdvisory);
router.get('/soil', authenticateJWT, authorizeRole([Role.FARMER]), advisory.getSoilAdvisory);
router.get('/messages', authenticateJWT, authorizeRole([Role.FARMER]), advisory.getMessages);
router.patch(
  '/:id/read',
  authenticateJWT,
  authorizeRole([Role.FARMER]),
  ownershipGuardDB('advisory'),
  advisory.markRead,
);

export default router;
