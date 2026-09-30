import { embedText } from './providers/index.js';
import { search as vectorSearch } from './vectorStore.js';
import { Blog } from '../../models/Blog.js';
import { BLOG_STATUS } from '../../config/constants.js';

/* Semantic search: embed the query, run vector similarity, hydrate blogs, rank.
   Falls back to keyword text search if no embeddings exist yet. */
export async function semanticSearch(query, { limit = 10, filter = {} } = {}) {
  const { embedding } = await embedText(query);
  const hits = await vectorSearch(embedding, limit * 2);

  if (!hits.length) {
    const kw = await Blog.find({ $text: { $search: query }, status: BLOG_STATUS.PUBLISHED, ...filter })
      .limit(limit)
      .populate('author', 'name avatar')
      .lean();
    return { mode: 'keyword-fallback', results: kw.map((b) => ({ blog: b, score: null })) };
  }

  const ids = hits.map((h) => h.blogId);
  const blogs = await Blog.find({ _id: { $in: ids }, status: BLOG_STATUS.PUBLISHED, ...filter })
    .populate('author', 'name avatar')
    .lean();
  const scoreById = new Map(hits.map((h) => [String(h.blogId), h.score]));
  const results = blogs
    .map((b) => ({ blog: b, score: scoreById.get(String(b._id)) ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { mode: 'semantic', results };
}
