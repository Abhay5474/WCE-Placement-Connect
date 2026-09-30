import { Router } from 'express';
import Joi from 'joi';
import * as ctrl from '../controllers/userController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/me/analytics', requireAuth, ctrl.myAnalytics);
router.patch('/me', requireAuth, ctrl.updateMe);
router.post('/request-access', requireAuth, ctrl.requestAccess);
router.post(
  '/reports',
  requireAuth,
  validate({
    body: Joi.object({
      targetType: Joi.string().valid('blog', 'comment').required(),
      blog: Joi.string().hex().length(24),
      comment: Joi.string().hex().length(24),
      reason: Joi.string().min(3).max(500).required(),
    }),
  }),
  ctrl.report
);
router.get('/:id', optionalAuth, ctrl.authorProfile);

export default router;
