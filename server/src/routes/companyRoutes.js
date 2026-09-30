import { Router } from 'express';
import Joi from 'joi';
import * as ctrl from '../controllers/companyController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../config/constants.js';

const router = Router();

const companyBody = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  logo: Joi.string().uri().allow(''),
  description: Joi.string().allow(''),
  industry: Joi.string().allow(''),
  website: Joi.string().uri().allow(''),
  roles: Joi.array().items(Joi.string()),
  requiredSkills: Joi.array().items(Joi.string()),
  placementType: Joi.array().items(Joi.string()),
  eligibility: Joi.string().allow(''),
  averagePreparationTime: Joi.string().allow(''),
  verifiedInformation: Joi.boolean(),
});

router.get('/', ctrl.list);
router.get('/compare', ctrl.compare);
router.get('/:slug', ctrl.getBySlug);
router.get('/:slug/prep-summary', ctrl.prepSummary);

const manage = requireRole(ROLES.COORDINATOR, ROLES.ADMIN);
router.post('/', requireAuth, manage, validate({ body: companyBody }), ctrl.create);
router.patch('/:id', requireAuth, manage, validate({ body: companyBody.fork(['name'], (s) => s.optional()) }), ctrl.update);
router.delete('/:id', requireAuth, manage, ctrl.remove);

export default router;
