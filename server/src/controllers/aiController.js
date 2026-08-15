import { analyze } from '../services/ai/writingAssistant.js';
import { moderate } from '../services/ai/moderation.js';
import { ask } from '../services/ai/preparationAssistant.js';
import { Blog } from '../models/Blog.js';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { processBlogAI } from '../services/aiPipeline.js';
import { ok, asyncHandler } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';

/* Writing assistant — analyze draft text before publishing (no persistence). */
export const analyzeText = asyncHandler(async (req, res) => {
  const { title = '', content } = req.body;
  ok(res, analyze(`${title}\n${content}`));
});

/* Privacy / moderation pre-check for the editor. */
export const moderationCheck = asyncHandler(async (req, res) => {
  ok(res, moderate(`${req.body.title || ''}\n${req.body.content || ''}`));
});

/* RAG placement assistant. */
export const assistant = asyncHandler(async (req, res) => {
  const query = (req.body.query || '').trim();
  if (!query) throw ApiError.badRequest('Query is required');
  ok(res, await ask(query, { limit: 5 }));
});

/* Force re-run of the AI pipeline for a blog (owner/admin) e.g. after editing. */
export const reprocess = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw ApiError.notFound('Blog not found');
  if (String(blog.author) !== String(req.user._id) && req.user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden();
  }
  const analysis = await processBlogAI(blog, { force: true });
  ok(res, { analysis }, 'AI analysis regenerated');
});

/* Fetch cached AI analysis for a blog. */
export const getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await AIAnalysis.findOne({ blog: req.params.id })
    .select('-embedding')
    .lean();
  ok(res, analysis ? { ...analysis, aiGenerated: true } : null);
});
