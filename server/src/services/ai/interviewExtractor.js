import { chat, providerName } from './providers/index.js';
import { extractQuestions as heuristicExtract } from './interviewAnalyzer.js';
import { logger } from '../../utils/logger.js';

/* LLM-based interview-question extractor.
   Uses the configured chat provider (Groq/Gemini) to pull ONLY genuine, well-framed
   interview questions out of a placement experience and return them as clean JSON.
   Falls back to the deterministic heuristic extractor when no real LLM is available
   (mock provider) or the model output can't be parsed. Runs inside the cached,
   background AI pipeline, so it costs one call per content change. */

const TOPICS = ['DSA', 'System Design', 'DBMS', 'OS', 'OOP', 'Networking', 'Aptitude', 'HR', 'Coding', 'General'];
const DIFFS = ['Easy', 'Medium', 'Hard'];

const SYSTEM = `You extract interview questions from a student's written placement/interview experience.
Return ONLY a JSON array — no markdown, no code fences, no commentary.
Each element must be: {"question": string, "topic": string, "difficulty": "Easy"|"Medium"|"Hard"}
where topic is one of: DSA, System Design, DBMS, OS, OOP, Networking, Aptitude, HR, Coding, General.

Rules:
- Include ONLY actual questions that were asked TO the candidate (technical, coding, aptitude, HR/behavioral).
- Rewrite each into a single, complete, grammatically correct question ending with "?".
  Fix truncation, spelling and remove any markdown symbols. Preserve the original meaning.
- Merge obvious duplicates. Split lists like "What is RAM and why is it needed" into separate questions.
- DO NOT include statements, narration, advice, results, section headings, or the candidate's own remarks.
- DO NOT invent questions that are not supported by the text.
- If there are no questions, return [].`;

function parseJsonArray(text) {
  if (!text) return null;
  let t = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

const IMPERATIVE_TASK = /^(reverse|implement|design|write|find|solve|sort|search|build|code|print|construct|merge|traverse|calculate|count)\b/i;

function normalizeItem(raw) {
  let q = String(raw?.question || '')
    .replace(/<[^>]+>/g, ' ')     // strip HTML
    .replace(/[*_`#]+/g, '')       // strip markdown
    .replace(/\s+/g, ' ')
    .trim();
  if (q.length < 6 || q.split(/\s+/).length < 2) return null;
  // Normalize terminal punctuation: coding tasks keep a period, questions end
  // with exactly one '?'.
  if (IMPERATIVE_TASK.test(q)) {
    q = q.replace(/[?!]+$/, '').trim();
  } else {
    q = q.replace(/[.?!]+$/, '').trim() + '?';
  }
  const normalized = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  if (normalized.length < 6) return null;
  const topic = TOPICS.includes(raw?.topic) ? raw.topic : 'General';
  const difficulty = DIFFS.includes(raw?.difficulty) ? raw.difficulty : 'Medium';
  return { question: q.charAt(0).toUpperCase() + q.slice(1), normalized, topic, difficulty };
}

export async function extractInterviewQuestions(plainText) {
  const text = String(plainText || '').trim();
  if (text.length < 40) return [];

  // No real LLM configured → use the deterministic heuristic.
  if (providerName === 'mock') return heuristicExtract(text);

  let items = null;
  try {
    const { text: out } = await chat({
      system: SYSTEM,
      prompt: `Placement/interview experience:\n"""\n${text.slice(0, 6000)}\n"""\n\nReturn the JSON array of questions.`,
    });
    items = parseJsonArray(out);
  } catch (err) {
    logger.error(`AI question extraction failed: ${err.message} — using heuristic`);
  }

  if (!Array.isArray(items)) return heuristicExtract(text);

  const seen = new Set();
  const result = [];
  for (const raw of items) {
    const item = normalizeItem(raw);
    if (!item || seen.has(item.normalized)) continue;
    seen.add(item.normalized);
    result.push(item);
  }
  // If the model returned nothing usable, fall back so we still surface something.
  return result.length ? result : heuristicExtract(text);
}
