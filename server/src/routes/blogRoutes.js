import { Router } from 'express';
import * as ctrl from '../controllers/blogController.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as v from '../validators/blogValidators.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/', optionalAuth, ctrl.list);
router.get('/mine', requireAuth, ctrl.myBlogs);
router.post('/', requireAuth, validate(v.createBlogSchema), ctrl.create);

router.get('/:slug/related', ctrl.related);
router.get('/:slug', optionalAuth, ctrl.getBySlug);

router.patch('/:id', requireAuth, validate(v.updateBlogSchema), ctrl.update);
router.delete('/:id', requireAuth, validate(v.idParam), ctrl.remove);

// Verification / highlight — faculty, coordinator, admin.
router.post(
  '/:id/verify',
  requireAuth,
  requireRole(ROLES.FACULTY, ROLES.COORDINATOR, ROLES.ADMIN),
  validate(v.verifySchema),
  ctrl.verify
);
router.post(
  '/:id/highlight',
  requireAuth,
  requireRole(ROLES.COORDINATOR, ROLES.ADMIN),
  validate(v.idParam),
  ctrl.highlight
);

export default router;
