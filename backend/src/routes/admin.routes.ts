import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, authorizeRole } from '../middleware';
import * as admin from '../controllers/admin.controller';

const router = Router();

const adminOnly = [Role.ADMIN];

router.get('/users', authenticateJWT, authorizeRole(adminOnly), admin.getUsers);
router.post('/users', authenticateJWT, authorizeRole(adminOnly), admin.createUser);
router.patch('/user/:id', authenticateJWT, authorizeRole(adminOnly), admin.updateUser);
router.patch('/user/:id/role', authenticateJWT, authorizeRole(adminOnly), admin.updateUserRole);
router.delete('/user/:id', authenticateJWT, authorizeRole(adminOnly), admin.deleteUser);
router.post('/assign-officer', authenticateJWT, authorizeRole(adminOnly), admin.assignOfficer);
router.post('/cooperative', authenticateJWT, authorizeRole(adminOnly), admin.createCooperative);
router.get('/audit-logs', authenticateJWT, authorizeRole(adminOnly), admin.getAuditLogs);
router.get('/system-health', authenticateJWT, authorizeRole(adminOnly), admin.getSystemHealth);

export default router;
