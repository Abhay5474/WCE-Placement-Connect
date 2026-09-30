import { keywords, readability, tone, sentences, wordCount } from './textStats.js';
import { classify } from './classifier.js';

/* AI Writing Assistant — grammar hints, tone, readability, keyword/tag/title
   generation and a blog quality score. Heuristic + provider-agnostic so it works
   offline; the LLM provider is used only for richer title/summary generation. */

const PLACEMENT_TAG_HINTS = ['dsa', 'system design', 'hr', 'sde', 'internship', 'aptitude', 'resume'];

export function extractTags(text, limit = 8) {
  const base = keywords(text, limit * 2);
  const lower = String(text || '').toLowerCase();
  const hinted = PLACEMENT_TAG_HINTS.filter((h) => lower.includes(h));
  return [...new Set([...hinted, ...base])].slice(0, limit).map((t) =>
    t.replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function generateTitles(text) {
  const kws = keywords(text, 5);
  const cat = classify(text).categories[0] || 'Placement Experience';
  const company = kws[0] ? kws[0].replace(/\b\w/g, (c) => c.toUpperCase()) : 'My';
  return [
    `${company} ${cat}: What I Learned`,
    `How I Prepared for ${company} — A ${cat}`,
    `${cat}: ${company} Interview Journey`,
  ];
}

/* Very light grammar heuristics — flags obvious issues without a heavy dependency.
   Presented as suggestions, never auto-corrections. */
export function grammarSuggestions(text) {
  const issues = [];
  const raw = String(text || '');
  if (/\bi\b/.test(raw)) issues.push('Use capitalized "I" instead of lowercase "i".');
  if (/\s{2,}/.test(raw)) issues.push('Remove double spaces.');
  if (/[a-z]\.[A-Z]/.test(raw)) issues.push('Add a space after full stops.');
  sentences(raw).forEach((s) => {
    if (wordCount(s) > 45) issues.push('A very long sentence was found — consider splitting it.');
  });
  return [...new Set(issues)];
}

export function qualityScore(text) {
  const wc = wordCount(text);
  const read = readability(text);
  const structure = Math.min(100, sentences(text).length * 8);
  const completeness = Math.min(100, Math.round((wc / 400) * 100));
  const grammar = Math.max(0, 100 - grammarSuggestions(text).length * 12);
  const relevance = classify(text).categories.length ? 85 : 55;
  const overall = Math.round((read + structure + completeness + grammar + relevance) / 5);
  return { readability: read, structure, completeness, grammar, relevance, overall };
}

/* Full analysis used by the "analyze before publishing" endpoint. */
export function analyze(text) {
  return {
    keywords: keywords(text, 10),
    tags: extractTags(text),
    titles: generateTitles(text),
    tone: tone(text),
    readability: readability(text),
    grammar: grammarSuggestions(text),
    quality: qualityScore(text),
    suggestedCategories: classify(text).categories,
    aiGenerated: true,
  };
}
