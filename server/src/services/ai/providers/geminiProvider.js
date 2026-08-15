import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

/* Google Gemini adapter (generativelanguage REST API). */
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export async function chat({ system = '', prompt = '', context = '' } = {}) {
  const body = {
    system_instruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ parts: [{ text: context ? `${prompt}\n\nContext:\n${context}` : prompt }] }],
  };
  const res = await fetch(
    `${BASE}/models/${env.ai.geminiChatModel}:generateContent?key=${env.ai.geminiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    logger.error(`Gemini failed: ${res.status} ${await res.text()}`);
    throw new Error(`Gemini request failed (${res.status})`);
  }
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return { text, provider: 'gemini' };
}

export async function embedText(text) {
  const res = await fetch(
    `${BASE}/models/text-embedding-004:embedContent?key=${env.ai.geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  );
  if (!res.ok) {
    logger.error(`Gemini embed failed: ${res.status}`);
    throw new Error(`Gemini embedding failed (${res.status})`);
  }
  const json = await res.json();
  return { embedding: json.embedding.values, model: 'text-embedding-004' };
}
