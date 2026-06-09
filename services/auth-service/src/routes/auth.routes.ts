import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler, validate, authenticate } from '@tzw/shared';
import { authController } from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotSchema,
  resetSchema,
} from '../validators/auth.schema';

const router = Router();

// Stricter throttle on credential endpoints to slow brute-force attacks.
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, standardHeaders: true });

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));
router.post('/forgot-password', authLimiter, validate(forgotSchema), asyncHandler(authController.forgotPassword));
router.post('/reset-password', authLimiter, validate(resetSchema), asyncHandler(authController.resetPassword));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
