import { sentences } from './textStats.js';

/* Extracts *interview questions* from placement-experience text.
   Precision over recall: it deliberately picks only things that read as a question
   or an explicit technical ask, and ignores narration, advice and section headings
   (the "important text" that used to leak in). */

// Verbs / words a genuine question or coding task tends to start with.
const QUESTION_START =
  /^(what|why|how|when|where|which|who|whose|do|does|did|is|are|was|were|can|could|would|will|should|have|has|name|tell me|difference between|explain|describe|reverse|implement|design|write|find|solve|sort|search|build|optimi[sz]e|code|print|given|calculate|count|check|merge|remove|detect|create|construct|traverse|return|define|derive|prove|compare|discuss|draw|list)\b/i;

// Explicit cue that a question was asked; text after it is the question.
const ASK_CUE =
  /\b(?:they\s+)?(?:asked|ask)\s+(?:me\s+|us\s+)?(?:to|about|regarding|on|whether|if)?\b|question\s+(?:was|were|asked)\s*[:-]?/i;

// After a cue, a topic-style question can start with these.
const AFTER_CUE_OK = /^(about|regarding|on|to |whether|if |what|why|how|the difference|difference)/i;

// Lines that are clearly section headers / narration, never questions.
const SECTION_LABEL =
  /^(company|job\s*role|role|placement\s*type|year|branch|eligibility|selection\s*process|questions?\s*asked|preparation(\s*strategy)?|resources?(\s*used)?|mistakes?(\s*to\s*avoid)?|final\s*result|result|advice(\s*for\s*juniors)?|technical\s*interview|hr\s*interview|online\s*assessment|group\s*discussion)$/i;

// "Round 1 — ...", "Round 2:" etc. A round label prefix is stripped so questions
// written on the same line as the round header are still captured.
const ROUND_PREFIX = /^round\s*\d+\s*[—–\-:.)]*\s*/i;

// First-person narration markers — drop candidates that are personal story, not a question.
const NARRATION = /\b(i|we|my|me|our)\b\s+(prepared|studied|got|was|were|solved|used|revised|practi|cleared|attended|received|felt|had|managed|started|joined)/i;

const TOPIC_HINTS = {
  DSA: ['array', 'linked list', 'tree', 'graph', 'string', 'dp', 'dynamic programming', 'sort', 'stack', 'queue', 'recursion', 'binary', 'heap', 'hash', 'pointer'],
  'System Design': ['design', 'scalable', 'scalability', 'architecture', 'cache', 'load balancer', 'microservice', 'url shortener'],
  HR: ['yourself', 'strength', 'weakness', 'relocate', 'why do you', 'why should we', 'salary', 'hobbies', 'family', 'about you'],
  DBMS: ['sql', 'query', 'database', 'normalization', 'index', 'inner join', 'outer join', 'left join', 'transaction', 'acid'],
  OS: ['process', 'thread', 'deadlock', 'scheduling', 'semaphore', 'paging', 'virtual memory'],
  OOP: ['oop', 'oops', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'class', 'object'],
  Networking: ['tcp', 'http', 'rest', 'api', 'dns', 'osi', 'udp', 'ip address'],
};

function guessTopic(q) {
  const lower = ` ${q.toLowerCase()} `;
  for (const [topic, hints] of Object.entries(TOPIC_HINTS)) {
    if (hints.some((h) => lower.includes(h))) return topic;
  }
  return 'General';
}

/* Turns HTML into plain text with sentence-friendly boundaries. */
function toPlainText(html) {
  return String(html || '')
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '. ')
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCandidate(raw) {
  let q = raw
    .replace(/^(round\s*\d+[:\-–]?\s*)/i, '')
    .replace(/^(they\s+asked\s+me\s+to\s+|i\s+was\s+asked\s+to\s+|asked\s+(me\s+)?to\s+)/i, '')
    .replace(/^[\s"'“”\-–—:•]+/, '')
    .replace(/[\s,.;:]+$/, (m) => (raw.trim().endsWith('?') ? '?' : ''))
    .trim();
  // Restore a trailing question mark if the original had one.
  if (raw.trim().endsWith('?') && !q.endsWith('?')) q += '?';
  return q;
}

function isQuestionLike(c) {
  const t = c.trim();
  if (t.length < 6) return false;
  const words = t.split(/\s+/).length;
  if (words < 2 || words > 30) return false;
  if (SECTION_LABEL.test(t)) return false;
  if (NARRATION.test(t)) return false;
  return t.endsWith('?') || QUESTION_START.test(t);
}

export function extractQuestions(text) {
  const found = new Map();
  const plain = toPlainText(text);

  for (const sentence of sentences(plain)) {
    // Drop a leading "Round N —" label, then keep any question text that follows.
    const s = sentence.trim().replace(ROUND_PREFIX, '').trim();
    if (!s || SECTION_LABEL.test(s)) continue;

    const candidates = [];
    const cueMatch = s.match(ASK_CUE);

    if (cueMatch) {
      // Take everything after the cue and split a list of asks.
      const after = s.slice(cueMatch.index + cueMatch[0].length).trim();
      for (const part of after.split(/\s+and\s+|,|;/i)) {
        const p = part.trim();
        if (p && (QUESTION_START.test(p) || AFTER_CUE_OK.test(p) || p.endsWith('?'))) candidates.push(p);
      }
    } else if (s.endsWith('?')) {
      // A directly written question — split only on explicit lists.
      s.split(/\s+and\s+|;/i).forEach((p) => candidates.push(p.trim()));
    } else if (QUESTION_START.test(s)) {
      // A listed technical task like "Reverse a linked list."
      s.split(/\s+and\s+|;/i).forEach((p) => candidates.push(p.trim()));
    }

    for (const raw of candidates) {
      const q = cleanCandidate(raw);
      if (!isQuestionLike(q)) continue;
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
