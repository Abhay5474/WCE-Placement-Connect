import { Router } from 'express';
import * as ctrl from '../controllers/searchController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', optionalAuth, ctrl.search);
export default router;
