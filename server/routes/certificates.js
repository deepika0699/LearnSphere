import { Router } from 'express';
import { param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { verifyCertificateHandler } from '../controllers/certificateController.js';

const router = Router();

/**
 * Validation rules for public certificate verification
 * Enforces canonical LS-XXXX-XXXX-XXXX format
 */
const verifyCertificateValidation = [
  param('certificateId')
    .trim()
    .matches(/^LS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/i)
    .withMessage('Invalid certificate ID format'),
  validateRequest,
];

/**
 * GET /api/certificates/verify/:certificateId
 * Public endpoint for verifying academic certificates by certificateId.
 * No authentication required. Protected by rate limiting and strict format validation.
 */
router.get(
  '/verify/:certificateId',
  apiLimiter,
  verifyCertificateValidation,
  verifyCertificateHandler
);

export default router;
