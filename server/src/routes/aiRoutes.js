import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import * as ctrl from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { env } from '../config/env.js';

const router = Router();

// Rate-limit AI endpoints to control cost/abuse.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.ai.rateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI rate limit reached. Please wait a moment.' },
});

router.use(requireAuth, aiLimiter);

router.post('/analyze', validate({ body: Joi.object({ title: Joi.string().allow(''), content: Joi.string().min(5).required() }) }), ctrl.analyzeText);
router.post('/moderation-check', ctrl.moderationCheck);
router.post('/assistant', validate({ body: Joi.object({ query: Joi.string().min(3).max(500).required() }) }), ctrl.assistant);
router.post('/blogs/:id/reprocess', ctrl.reprocess);
router.get('/blogs/:id/analysis', ctrl.getAnalysis);

export default router;
