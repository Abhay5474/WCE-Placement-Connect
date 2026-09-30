import { AIAnalysis } from '../../models/AIAnalysis.js';
import { Blog } from '../../models/Blog.js';
import { env } from '../../config/env.js';
import { BLOG_STATUS } from '../../config/constants.js';

/* Vector search abstraction.
   - backend=atlas → uses MongoDB Atlas Vector Search ($vectorSearch) on AIAnalysis.
   - backend=local → in-memory cosine similarity over stored embeddings (dev fallback).
   Both return [{ blogId, score }]. */

export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

async function searchAtlas(embedding, limit) {
  const results = await AIAnalysis.aggregate([
    {
      $vectorSearch: {
        index: env.vector.atlasIndex,
        path: 'embedding',
        queryVector: embedding,
        numCandidates: Math.max(100, limit * 10),
        limit,
      },
    },
    { $project: { blog: 1, score: { $meta: 'vectorSearchScore' } } },
  ]);
  return results.map((r) => ({ blogId: r.blog, score: r.score }));
}

async function searchLocal(embedding, limit) {
  // Only consider embeddings for published blogs.
  const publishedIds = await Blog.find({ status: BLOG_STATUS.PUBLISHED }).distinct('_id');
  const idSet = new Set(publishedIds.map(String));
  const docs = await AIAnalysis.find({ embedding: { $exists: true, $ne: [] } })
    .select('blog embedding')
    .lean();
  return docs
    .filter((d) => idSet.has(String(d.blog)))
    .map((d) => ({ blogId: d.blog, score: cosine(embedding, d.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function search(embedding, limit = 10) {
  if (!embedding?.length) return [];
  return env.vector.backend === 'atlas' ? searchAtlas(embedding, limit) : searchLocal(embedding, limit);
}
