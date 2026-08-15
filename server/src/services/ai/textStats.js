/* Lightweight NLP heuristics shared across AI modules — deterministic and
   provider-independent, so keyword/readability/tags work even with the mock provider. */

const STOPWORDS = new Set(
  ('a an and are as at be by for from has have i in is it its of on or that the to was were will with ' +
    'this these those my me we you your they them he she his her but not so if then than about into over ' +
    'after before during round interview experience company asked using used our their there here what how')
    .split(' ')
);

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function sentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function keywords(text, limit = 10) {
  const freq = new Map();
  for (const t of tokenize(text)) {
    if (t.length < 3 || STOPWORDS.has(t)) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

/* Flesch Reading Ease (approx) → normalized 0-100 readability. */
export function readability(text) {
  const words = tokenize(text);
  const sents = sentences(text);
  if (!words.length || !sents.length) return 50;
  const syllables = words.reduce((s, w) => s + Math.max(1, (w.match(/[aeiouy]+/g) || []).length), 0);
  const flesch = 206.835 - 1.015 * (words.length / sents.length) - 84.6 * (syllables / words.length);
  return Math.max(0, Math.min(100, Math.round(flesch)));
}

export function wordCount(text) {
  return tokenize(text).length;
}

export function readingTimeMin(text) {
  return Math.max(1, Math.round(wordCount(text) / 200));
}

/* Simple lexicon-based tone/sentiment. */
const POSITIVE = new Set(['great', 'good', 'confident', 'helpful', 'excellent', 'success', 'selected', 'easy', 'clear', 'positive', 'enjoyed', 'smooth']);
const NEGATIVE = new Set(['hard', 'difficult', 'rejected', 'failed', 'nervous', 'confusing', 'tough', 'stress', 'bad', 'poor', 'negative', 'struggled']);
const FORMAL = new Set(['therefore', 'moreover', 'consequently', 'furthermore', 'regarding', 'additionally']);

export function tone(text) {
  const toks = tokenize(text);
  let pos = 0;
  let neg = 0;
  let formal = 0;
  for (const t of toks) {
    if (POSITIVE.has(t)) pos++;
    if (NEGATIVE.has(t)) neg++;
    if (FORMAL.has(t)) formal++;
  }
  const total = pos + neg || 1;
  return {
    sentiment: pos >= neg ? 'positive' : 'negative',
    positivity: Math.round((pos / total) * 100),
    formality: formal > 1 ? 'formal' : 'informal',
    subjectivity: Math.min(100, Math.round(((pos + neg) / (toks.length || 1)) * 100 * 5)),
  };
}
