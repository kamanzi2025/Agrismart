import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, authorizeRole, ownershipGuardDB } from '../middleware';
import { pestImageUpload } from '../utils/fileUpload';
import * as pest from '../controllers/pest.controller';
import { diagnoseReport } from '../controllers/officer.controller';

const router = Router();

// Farmer: submit pest image report
router.post(
  '/report',
  authenticateJWT,
  authorizeRole([Role.FARMER]),
  pestImageUpload,
  pest.submitReport,
);

// Farmer: list own reports (paginated)
router.get('/reports', authenticateJWT, authorizeRole([Role.FARMER]), pest.getReports);

// Farmer: get single report (ownership verified)
router.get(
  '/report/:id',
  authenticateJWT,
  authorizeRole([Role.FARMER]),
  ownershipGuardDB('pestReport'),
  pest.getReport,
);

// Any authenticated user: browse pest library
router.get('/library', authenticateJWT, pest.getPestLibrary);

// Officer / Admin: diagnose a pest report
router.put(
  '/report/:id/diagnose',
  authenticateJWT,
  authorizeRole([Role.EXTENSION_OFFICER, Role.ADMIN]),
  diagnoseReport,
);

export default router;
