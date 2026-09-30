import { chat } from './providers/index.js';
import { summarizeExtractive } from './providers/index.js';
import { keywords } from './textStats.js';

/* Generates a short summary + a structured "quick summary" for placement blogs.
   Always returned with aiGenerated:true so the UI can label it. */

export async function summarize(plainText) {
  const { text: summary, provider } = await chat({
    task: 'summarize',
    system:
      'You are summarizing a student\'s placement/interview experience. Write 2-4 concise ' +
      'sentences capturing the company, role, interview rounds, what was asked, how they ' +
      'prepared and the outcome. Use only what is in the text; do not invent details.',
    prompt: plainText,
  });
  return { summary: (summary || summarizeExtractive(plainText, 3)).trim(), provider, aiGenerated: true };
}

/* Counts distinct interview rounds mentioned in the free text (e.g. "Round 1",
   "Round 2 — Technical"), used when the author didn't fill structured rounds. */
export function countRoundsInText(text = '') {
  const nums = new Set();
  for (const m of String(text).matchAll(/\bround\s*(\d+)/gi)) nums.add(m[1]);
  // Also count common named rounds if numbered ones are absent.
  if (!nums.size) {
    const named = [/online\s+assessment/i, /technical\s+interview/i, /hr\s+interview/i, /group\s+discussion/i, /coding\s+round/i, /managerial\s+round/i];
    return named.filter((re) => re.test(text)).length;
  }
  return nums.size;
}

/* Structured quick summary — prefers the author's structured fields, but falls
   back to what's written in the experience text (rounds, skills) so it reflects
   the actual blog rather than showing zeros. Deterministic — no LLM cost. */
export function quickSummary(blog, extractedQuestions = [], plainText = '') {
  const p = blog.placement || {};
  const roundsMeta = Array.isArray(p.rounds) ? p.rounds.length : 0;
  const rounds = roundsMeta || countRoundsInText(plainText || blog.content || '');
  const skills = (p.skills && p.skills.length ? p.skills : keywords(plainText, 6)) || [];
  return {
    company: p.companyName || 'Not specified',
    role: p.role || 'Not specified',
    placementType: p.placementType || 'Not specified',
    rounds,
    skills,
    keyQuestions: extractedQuestions.slice(0, 5),
    preparationTime: p.preparationDuration || 'Not specified',
    result: p.result || 'Not disclosed',
    aiGenerated: true,
  };
}
