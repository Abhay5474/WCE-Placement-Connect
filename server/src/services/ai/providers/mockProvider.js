import crypto from 'crypto';

/* Deterministic, offline AI provider. Requires no API key so the whole platform
   runs and demos anywhere. It produces stable, plausible outputs derived from the
   input text — never real model output, and callers label results AI-generated. */

const EMBED_DIM = 256;

/* Hash-based bag-of-words embedding. Deterministic and good enough for local
   semantic-search demos (similar text → similar vectors). */
export function embed(text) {
  const vec = new Array(EMBED_DIM).fill(0);
  const tokens = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  for (const tok of tokens) {
    const h = crypto.createHash('md5').update(tok).digest();
    const idx = h.readUInt16LE(0) % EMBED_DIM;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

export async function embedText(text) {
  return { embedding: embed(text), model: 'mock-embed-256' };
}

/* Very small templated "chat". `task` lets callers request a shaped response. */
export async function chat({ system = '', prompt = '', task = 'generic', context = '' } = {}) {
  const text = `${prompt}\n${context}`.trim();
  if (task === 'assistant') {
    const grounded = context
      ? `Based on the WCEConnect AI content provided, here is guidance for your query.\n\n${summarizeText(context, 3)}\n\nFocus your preparation on the topics and companies mentioned above, and open the cited blogs for detailed experiences.`
      : `I could not find enough WCEConnect AI content to answer this confidently. Please try a broader query or contribute an experience so future students benefit.`;
    return { text: grounded, provider: 'mock' };
  }
  return { text: summarizeText(text, 3) || 'No content provided.', provider: 'mock' };
}

/* Extractive helpers reused by higher-level modules. */
export function summarizeText(text, sentences = 3) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const parts = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
  return parts.slice(0, sentences).join(' ');
}
