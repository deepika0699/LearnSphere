import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refresh, logout, getMe } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply dedicated rate limiting to all authentication endpoints
router.use(authLimiter);

/**
 * Validation rules for POST /api/auth/register
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  validateRequest,
];

/**
 * Validation rules for POST /api/auth/login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest,
];

// Student Registration Endpoint
router.post('/register', registerValidation, register);

// User Login Endpoint
router.post('/login', loginValidation, login);

// Token Refresh Endpoint
router.post('/refresh', refresh);

// User Logout Endpoint
router.post('/logout', logout);

// Get Current Authenticated User Endpoint
router.get('/me', authenticate, getMe);

export default router;
