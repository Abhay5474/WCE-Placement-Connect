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
      branch: Joi.string().allow(''),
      year: Joi.number().integer().min(1).max(5),
      skills: Joi.array().items(Joi.string()),
      targetRoles: Joi.array().items(Joi.string()),
      targetCompanies: Joi.array().items(Joi.string().hex().length(24)),
      preparationProgress: Joi.array().items(Joi.object({ topic: Joi.string(), completed: Joi.number().min(0).max(100) })),
      savedResources: Joi.array().items(Joi.object({ label: Joi.string(), url: Joi.string().uri() })),
    }).min(1),
  }),
  ctrl.updateProfile
);
router.get('/dashboard', requireAuth, ctrl.dashboard);
router.get('/recommendations', requireAuth, ctrl.recommendations);

export default router;
