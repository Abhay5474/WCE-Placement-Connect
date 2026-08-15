import { sentences } from './textStats.js';

/* Extracts interview questions from placement-experience text. Detects explicit
   questions and imperative "asked me to..." statements, then normalizes them. */

const IMPERATIVE = /\b(reverse|implement|design|explain|write|find|solve|sort|search|build|optimi[sz]e|describe|code)\b/i;
const ASK_CUE = /\b(asked|question was|they asked|round \d|interviewer asked)\b/i;
const TOPIC_HINTS = {
  DSA: ['array', 'linked list', 'tree', 'graph', 'string', 'dp', 'dynamic programming', 'sort', 'stack', 'queue', 'recursion'],
  'System Design': ['design', 'scalable', 'architecture', 'cache', 'load balancer'],
  DBMS: ['sql', 'query', 'database', 'normalization', 'index', 'join'],
  OS: ['process', 'thread', 'deadlock', 'scheduling', 'memory'],
  HR: ['yourself', 'strength', 'weakness', 'why', 'relocate'],
  Networking: ['tcp', 'http', 'rest', 'api', 'dns', 'osi'],
};

function guessTopic(q) {
  const lower = q.toLowerCase();
  for (const [topic, hints] of Object.entries(TOPIC_HINTS)) {
    if (hints.some((h) => lower.includes(h))) return topic;
  }
  return 'General';
}

export function extractQuestions(text) {
  const found = new Map();
  for (const s of sentences(text)) {
    const isQuestion = s.endsWith('?');
    const looksLikeAsk = ASK_CUE.test(s) || IMPERATIVE.test(s);
    if (!isQuestion && !looksLikeAsk) continue;

    // Split compound "reverse a list and explain REST" into separate items.
    const clauses = s.split(/\band\b|,|;/i).map((c) => c.trim()).filter((c) => c.length > 8);
    for (const c of clauses) {
      if (!(IMPERATIVE.test(c) || c.endsWith('?'))) continue;
      const q = c.replace(/^(round \d+[:\-]?\s*|they asked me to\s*|i was asked to\s*|asked to\s*)/i, '').trim();
      const normalized = q.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      if (normalized.length < 6 || found.has(normalized)) continue;
      found.set(normalized, {
        question: q.charAt(0).toUpperCase() + q.slice(1),
        normalized,
        topic: guessTopic(q),
      });
    }
  }
  return [...found.values()];
}
