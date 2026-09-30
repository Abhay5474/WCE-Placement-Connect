import { CATEGORIES } from '../../config/constants.js';
import { tokenize } from './textStats.js';

/* Keyword-driven blog classifier. AI suggestions are advisory only — controllers
   store them as `aiSuggestedCategories` alongside the user's own choices, and
   users/admins can correct them (the brief: "do not blindly trust AI"). */
const SIGNALS = {
  'Placement Experience': ['placement', 'offer', 'ctc', 'package', 'selected', 'oncampus', 'on-campus'],
  'Internship Experience': ['internship', 'intern', 'ppo', 'summer'],
  'Interview Questions': ['question', 'asked', 'problem', 'puzzle'],
  'Resume Guidance': ['resume', 'cv', 'ats', 'projects section'],
  DSA: ['dsa', 'array', 'linked list', 'tree', 'graph', 'dynamic programming', 'leetcode', 'algorithm'],
  'System Design': ['system design', 'scalability', 'load balancer', 'microservice', 'hld', 'lld'],
  Aptitude: ['aptitude', 'quant', 'logical reasoning', 'verbal'],
  'HR Interview': ['hr', 'behavioral', 'tell me about yourself', 'strengths', 'weakness'],
  'Technical Interview': ['technical', 'oops', 'dbms', 'operating system', 'networking', 'coding round'],
  'Career Guidance': ['career', 'roadmap', 'guidance', 'advice', 'strategy'],
  'Company Preparation': ['prepare for', 'preparation', 'company specific'],
  'Off-Campus': ['off campus', 'off-campus', 'referral', 'applied online'],
  'On-Campus': ['on campus', 'on-campus', 'campus drive'],
};

export function classify(text, top = 3) {
  const hay = ' ' + tokenize(text).join(' ') + ' ';
  const raw = String(text || '').toLowerCase();
  const scores = CATEGORIES.map((cat) => {
    const signals = SIGNALS[cat] || [];
    let score = 0;
    for (const s of signals) {
      if (s.includes(' ')) {
        if (raw.includes(s)) score += 2;
      } else if (hay.includes(` ${s} `)) score += 1;
    }
    return { category: cat, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    categories: scores.slice(0, top).map((s) => s.category),
    scores: scores.slice(0, top),
  };
}
