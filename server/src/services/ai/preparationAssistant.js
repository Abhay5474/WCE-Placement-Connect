import { chat } from './providers/index.js';
import { semanticSearch } from './semanticSearch.js';

/* RAG placement assistant.
   Pipeline: query → embed → vector search → context construction → LLM → grounded
   response WITH citations. The system prompt forbids inventing college-specific
   facts; if retrieval is empty we say so instead of hallucinating. */

const SYSTEM = `You are the WCEConnect AI placement assistant for a college.
Answer ONLY using the provided WCEConnect AI blog excerpts as your source of
institutional facts. Do NOT invent college-specific placement details, company
policies, salaries, or outcomes. If the excerpts do not contain enough
information, clearly say so. Recommend relevant blogs, skills and a short
preparation roadmap. Keep the tone practical and encouraging.`;

export async function ask(query, { limit = 5 } = {}) {
  const { results, mode } = await semanticSearch(query, { limit });

  if (!results.length) {
    return {
      answer:
        'I could not find enough WCEConnect AI content to answer this confidently yet. ' +
        'Try a broader query, or contribute a placement experience so future students benefit.',
      citations: [],
      grounded: false,
      aiGenerated: true,
    };
  }

  // Build a bounded context block from retrieved blogs.
  const context = results
    .map((r, i) => {
      const b = r.blog;
      const body = (b.excerpt || b.content || '').slice(0, 600);
      return `[${i + 1}] "${b.title}" (${b.placement?.companyName || 'general'}): ${body}`;
    })
    .join('\n\n');

  const { text, provider } = await chat({ task: 'assistant', system: SYSTEM, prompt: query, context });

  const citations = results.map((r, i) => ({
    index: i + 1,
    id: r.blog._id,
    title: r.blog.title,
    slug: r.blog.slug,
    company: r.blog.placement?.companyName || null,
    score: r.score,
  }));

  return {
    answer: text,
    citations,
    grounded: true,
    retrievalMode: mode,
    provider,
    note: 'Based on WCEConnect AI blogs. Open the cited sources for full details.',
    aiGenerated: true,
  };
}
