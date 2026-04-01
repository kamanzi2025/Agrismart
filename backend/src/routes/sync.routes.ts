import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, authorizeRole } from '../middleware';
import { sync } from '../controllers/sync.controller';

const router = Router();

router.post('/', authenticateJWT, authorizeRole([Role.FARMER]), sync);

export default router;
