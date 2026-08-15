import { semanticSearch } from '../services/ai/semanticSearch.js';
import { listBlogs } from '../services/blogQueryService.js';
import { SearchHistory } from '../models/tracking.js';
import { ok, asyncHandler } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';

/* Unified search endpoint supporting both keyword and semantic modes. */
export const search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  const mode = req.query.mode === 'semantic' ? 'semantic' : 'keyword';
  if (!q) throw ApiError.badRequest('Query is required');

  let payload;
  if (mode === 'semantic') {
    const { results, mode: usedMode } = await semanticSearch(q, { limit: 12 });
    payload = { mode: usedMode, results };
  } else {
    const { items, meta } = await listBlogs({ ...req.query, q });
    payload = { mode: 'keyword', results: items.map((blog) => ({ blog, score: null })), meta };
  }

  // Log for trending/analytics (fire and forget).
  SearchHistory.create({
    user: req.user?._id,
    query: q,
    mode,
    resultCount: payload.results.length,
  }).catch(() => {});

  ok(res, payload);
});
