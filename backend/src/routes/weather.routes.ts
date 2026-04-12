import { Router } from 'express';
import { getWeather } from '../controllers/weatherController';

const router = Router();

// GET /api/weather?loc=Musanze
// No authentication required — public endpoint (SRS §6.4)
router.get('/', getWeather);

export default router;
