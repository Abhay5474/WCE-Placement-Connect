import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as ctrl from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as v from '../validators/authValidators.js';

const router = Router();

// Stricter limiter on credential endpoints to blunt brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later.' },
});

router.post('/register', authLimiter, validate(v.registerSchema), ctrl.register);
router.post('/verify-email', validate(v.verifyEmailSchema), ctrl.verifyEmail);
router.post('/login', authLimiter, validate(v.loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', requireAuth, ctrl.logout);
router.get('/me', requireAuth, ctrl.me);
router.post('/forgot-password', authLimiter, validate(v.forgotSchema), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetSchema), ctrl.resetPassword);
router.post('/change-password', requireAuth, validate(v.changePasswordSchema), ctrl.changePassword);

export default router;
