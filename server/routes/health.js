import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

/**
 * GET /api/health
 * Simple health check endpoint confirming that the LearnSphere backend is running.
 */
router.get('/health', getHealth);

export default router;
