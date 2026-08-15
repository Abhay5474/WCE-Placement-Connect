import { Router } from 'express';
import Joi from 'joi';
import * as ctrl from '../controllers/interactionController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const commentSchema = {
  body: Joi.object({
    content: Joi.string().min(1).max(2000).required(),
    parent: Joi.string().hex().length(24).allow(null),
  }),
};

// Comments
router.get('/blogs/:blogId/comments', ctrl.listComments);
router.post('/blogs/:blogId/comments', requireAuth, validate(commentSchema), ctrl.addComment);
router.delete('/comments/:id', requireAuth, ctrl.deleteComment);

// Likes / bookmarks
router.post('/blogs/:blogId/like', requireAuth, ctrl.toggleLike);
router.post('/blogs/:blogId/bookmark', requireAuth, ctrl.toggleBookmark);
router.get('/bookmarks', requireAuth, ctrl.myBookmarks);

// Follow
router.post('/users/:userId/follow', requireAuth, ctrl.toggleFollow);

export default router;
