/* AI-assisted moderation. Detects potential issues and returns FLAGS for human
   review — it never auto-deletes. Also detects personal information so the editor
   can warn the author before publishing (privacy requirement). */

const ABUSE = ['idiot', 'stupid', 'hate', 'trash', 'loser', 'shut up'];
const SPAM = ['buy now', 'click here', 'free money', 'subscribe now', 'earn cash', 'http://bit.ly'];
const UNVERIFIABLE = ['guaranteed placement', '100% selection', 'insider info', 'leaked paper'];

const PII_PATTERNS = [
  { key: 'phone', re: /\b(?:\+91[- ]?)?[6-9]\d{9}\b/ },
  { key: 'email', re: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i },
  { key: 'aadhaar', re: /\b\d{4}\s?\d{4}\s?\d{4}\b/ },
];

function hits(text, list) {
  const lower = String(text || '').toLowerCase();
  return list.filter((w) => lower.includes(w));
}

export function moderate(text) {
  const abuse = hits(text, ABUSE);
  const spam = hits(text, SPAM);
  const unverifiable = hits(text, UNVERIFIABLE);
  const pii = PII_PATTERNS.filter((p) => p.re.test(String(text || ''))).map((p) => p.key);

  const flags = [];
  if (abuse.length) flags.push({ type: 'abuse', severity: 'medium', matches: abuse });
  if (spam.length) flags.push({ type: 'spam', severity: 'medium', matches: spam });
  if (unverifiable.length)
    flags.push({ type: 'unverifiable_claims', severity: 'low', matches: unverifiable });
  if (pii.length) flags.push({ type: 'personal_information', severity: 'high', matches: pii });

  return {
    flagged: flags.length > 0,
    flags,
    hasPII: pii.length > 0,
    // Framed as assistance, not a verdict (AI principles in the brief).
    message: flags.length
      ? 'AI detected content that may need review. Please check before publishing.'
      : 'No issues detected by automated review.',
    aiGenerated: true,
  };
}
