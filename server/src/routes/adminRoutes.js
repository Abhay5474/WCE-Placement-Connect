import { Router } from 'express';
import * as ctrl from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Analytics + reports available to admin AND placement coordinator.
router.get('/analytics', requireAuth, requireRole(ROLES.ADMIN, ROLES.COORDINATOR), ctrl.analytics);
router.get('/reports', requireAuth, requireRole(ROLES.ADMIN, ROLES.COORDINATOR, ROLES.FACULTY), ctrl.listReports);
router.post('/reports/:id/resolve', requireAuth, requireRole(ROLES.ADMIN, ROLES.COORDINATOR, ROLES.FACULTY), ctrl.resolveReport);
router.get('/flagged', requireAuth, requireRole(ROLES.ADMIN, ROLES.COORDINATOR), ctrl.flaggedContent);

// User + role management — admin only.
router.get('/users', requireAuth, requireRole(ROLES.ADMIN), ctrl.listUsers);
router.patch('/users/:id/role', requireAuth, requireRole(ROLES.ADMIN), ctrl.setRole);
router.patch('/users/:id/active', requireAuth, requireRole(ROLES.ADMIN), ctrl.setActive);

export default router;
