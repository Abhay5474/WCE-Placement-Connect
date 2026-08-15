import { chat } from './providers/index.js';
import { summarizeExtractive } from './providers/index.js';

/* Generates a short summary + a structured "quick summary" for placement blogs.
   Always returned with aiGenerated:true so the UI can label it. */

export async function summarize(text) {
  const { text: summary, provider } = await chat({
    task: 'summarize',
    system: 'Summarize the placement experience in 2-3 concise sentences.',
    prompt: text,
  });
  return { summary: summary || summarizeExtractive(text, 3), provider, aiGenerated: true };
}

/* Structured quick summary is derived from the blog's placement metadata when
   present, plus extracted skills/questions. Deterministic — no LLM cost. */
export function quickSummary(blog, extractedQuestions = []) {
  const p = blog.placement || {};
  return {
    company: p.companyName || 'Not specified',
    role: p.role || 'Not specified',
    placementType: p.placementType || 'Not specified',
    rounds: Array.isArray(p.rounds) ? p.rounds.length : 0,
    skills: p.skills || [],
    keyQuestions: extractedQuestions.slice(0, 5),
    preparationTime: p.preparationDuration || 'Not specified',
    result: p.result || 'Not disclosed',
    aiGenerated: true,
  };
}
