/* Client-side "beautify" for placement experiences.
   It ONLY cleans presentation — spacing, capitalization, punctuation gaps, line
   breaks, section headings and lists — and never rewrites the author's words or
   meaning. Deeper grammar rewriting would need a real LLM provider; this stays
   deterministic so it works offline and is safe to apply automatically. */

const SECTION_LABELS = [
  'company', 'job role', 'role', 'placement type', 'year', 'branch', 'eligibility',
  'selection process', 'questions asked', 'preparation', 'preparation strategy',
  'resources', 'resources used', 'mistakes', 'mistakes to avoid', 'final result',
  'result', 'advice', 'advice for juniors', 'about the company', 'coding round',
  'technical interview', 'hr interview', 'online assessment', 'group discussion',
];

export function stripHtml(html) {
  return String(html || '')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Meaning-preserving cleanup of a single line of prose. */
function cleanInline(line) {
  let t = line.replace(/\s+/g, ' ').trim();
  t = t.replace(/\s+([,.;:!?])/g, '$1');          // no space before punctuation
  t = t.replace(/([,;:])(?=\S)/g, '$1 ');          // one space after , ; :
  t = t.replace(/([.!?])(?=[A-Za-z])/g, '$1 ');    // space after sentence enders
  t = t.replace(/\bi\b/g, 'I');                    // standalone i -> I
  t = t.replace(/\s{2,}/g, ' ').trim();
  // Capitalize the first letter of every sentence in the line.
  t = t.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase());
  return t;
}

function isHeading(line) {
  const t = line.replace(/[:*#]+$/,'').trim();
  const lower = t.toLowerCase().replace(/[:*#]/g, '').trim();
  if (/^#{1,3}\s+/.test(line)) return true;                    // markdown ##
  if (/^round\s*\d+/i.test(lower)) return true;                // Round 1/2/3
  if (line.trim().endsWith(':') && t.split(/\s+/).length <= 6) return true;
  return SECTION_LABELS.includes(lower);
}

function isListItem(line) {
  return /^\s*([-*•]|\d+[.)])\s+/.test(line);
}

/* Convert raw text (or existing HTML) into clean, structured HTML. */
export function beautifyToHtml(input) {
  const text = stripHtml(input);
  if (!text) return '';
  const lines = text.split('\n');
  const out = [];
  let list = [];

  const flushList = () => {
    if (list.length) {
      out.push('<ul>' + list.map((li) => `<li>${escapeHtml(cleanInline(li))}</li>`).join('') + '</ul>');
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }

    if (isListItem(line)) {
      list.push(line.replace(/^\s*([-*•]|\d+[.)])\s+/, ''));
      continue;
    }
    flushList();

    if (isHeading(line)) {
      const label = cleanInline(line.replace(/^#{1,3}\s+/, '').replace(/[:*#]+$/, '').trim());
      out.push(`<h3>${escapeHtml(label)}</h3>`);
    } else {
      let p = cleanInline(line);
      if (!/[.!?:]$/.test(p)) p += '.'; // finish the sentence
      out.push(`<p>${escapeHtml(p)}</p>`);
    }
  }
  flushList();
  return out.join('\n');
}
