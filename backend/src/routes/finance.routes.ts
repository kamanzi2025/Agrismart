import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, authorizeRole, ownershipGuardDB } from '../middleware';
import * as finance from '../controllers/finance.controller';

const router = Router();

// All finance routes require FARMER role
router.post('/record', authenticateJWT, authorizeRole([Role.FARMER]), finance.createRecord);

router.get('/records', authenticateJWT, authorizeRole([Role.FARMER]), finance.getRecords);

router.delete(
  '/record/:id',
  authenticateJWT,
  authorizeRole([Role.FARMER]),
  ownershipGuardDB('financialRecord'),
  finance.deleteRecord,
);

router.get('/summary', authenticateJWT, authorizeRole([Role.FARMER]), finance.getSummary);

export default router;
