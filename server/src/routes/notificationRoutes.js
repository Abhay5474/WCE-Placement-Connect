import { Router } from 'express';
import * as ctrl from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', ctrl.list);
router.post('/read-all', ctrl.markAllRead);
router.post('/:id/read', ctrl.markRead);
export default router;
