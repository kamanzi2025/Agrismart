import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/auth.controller';

const router = Router();

/**
 * POST /api/auth/register
 * Register any user type (FARMER, EXTENSION_OFFICER, COOPERATIVE_LEADER, ADMIN).
 * Body: { name, phone, password, role, location, language?, farmSize?, soilType? }
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Authenticate with phone + password.
 * Body: { phone, password }
 */
router.post('/login', login);

/**
 * POST /api/auth/refresh
 * Exchange a refresh token for a new access token (token rotation).
 * Body: { refreshToken }
 */
router.post('/refresh', refresh);

/**
 * POST /api/auth/logout
 * Invalidate a refresh token.
 * Body: { refreshToken }
 */
router.post('/logout', logout);

export default router;
