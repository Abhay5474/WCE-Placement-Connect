import { Router } from 'express';
import * as ctrl from '../controllers/interviewQuestionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', ctrl.list);
router.get('/frequent', ctrl.frequent);
router.post('/:id/verify', requireAuth, ctrl.verify);

export default router;
