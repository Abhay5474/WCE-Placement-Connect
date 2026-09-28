import { env } from '../../../config/env.js';

/* Google Gemini adapter (generativelanguage REST API). */
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/* Extracts the human-readable reason from a Gemini error response. */
async function readError(res) {
  try {
    const json = JSON.parse(await res.text());
    return json?.error?.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function chat({ system = '', prompt = '', context = '' } = {}) {
  const body = {
    system_instruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ parts: [{ text: context ? `${prompt}\n\nContext:\n${context}` : prompt }] }],
  };
  const res = await fetch(
    `${BASE}/models/${env.ai.geminiChatModel}:generateContent?key=${env.ai.geminiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(`Gemini chat: ${await readError(res)}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return { text, provider: 'gemini' };
}

export async function embedText(text) {
  const model = env.ai.geminiEmbedModel;
  const res = await fetch(`${BASE}/models/${model}:embedContent?key=${env.ai.geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: `models/${model}`, content: { parts: [{ text }] } }),
  });
  if (!res.ok) throw new Error(`Gemini embed: ${await readError(res)}`);
  const json = await res.json();
  return { embedding: json.embedding.values, model };
}
