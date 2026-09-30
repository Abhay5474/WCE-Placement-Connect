import { Router } from 'express';
import { env } from '../config/env.js';
import authRoutes from './authRoutes.js';
import blogRoutes from './blogRoutes.js';
import interactionRoutes from './interactionRoutes.js';
import companyRoutes from './companyRoutes.js';
import interviewQuestionRoutes from './interviewQuestionRoutes.js';
import searchRoutes from './searchRoutes.js';
import aiRoutes from './aiRoutes.js';
import placementRoutes from './placementRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Public config (safe subset) for the frontend, e.g. institution name/domain.
router.get('/config', (req, res) =>
  res.json({
    success: true,
    data: {
      institutionName: env.institutionName,
      collegeEmailDomain: env.collegeEmailDomain,
      aiProvider: env.ai.provider,
      requireEmailVerification: env.requireEmailVerification,
    },
  })
);

router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/', interactionRoutes); // /blogs/:id/comments, /users/:id/follow, /bookmarks
router.use('/companies', companyRoutes);
router.use('/interview-questions', interviewQuestionRoutes);
router.use('/search', searchRoutes);
router.use('/ai', aiRoutes);
router.use('/placement', placementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
