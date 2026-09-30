import { Router } from 'express';
import Joi from 'joi';
import * as ctrl from '../controllers/placementController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Public hub
router.get('/hub', ctrl.hub);

// Authenticated
router.get('/profile', requireAuth, ctrl.getProfile);
router.put(
  '/profile',
  requireAuth,
  validate({
    body: Joi.object({
      branch: Joi.string().trim().min(1).required(),
      year: Joi.number().integer().valid(1, 2, 3, 4).required(),
      skills: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
      targetRoles: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
      targetCompanies: Joi.array().items(Joi.string().hex().length(24)),
      preparationProgress: Joi.array().items(Joi.object({ topic: Joi.string(), completed: Joi.number().min(0).max(100) })),
      savedResources: Joi.array().items(Joi.object({ label: Joi.string(), url: Joi.string().uri() })),
    }).required(),
  }),
  ctrl.updateProfile
);
router.get('/dashboard', requireAuth, ctrl.dashboard);
router.get('/recommendations', requireAuth, ctrl.recommendations);

export default router;
