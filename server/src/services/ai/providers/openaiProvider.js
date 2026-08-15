import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

/* OpenAI adapter using the public REST API via fetch (Node 18+). Falls back to a
   thrown error if no key is configured; the provider selector guards against that. */

const BASE = 'https://api.openai.com/v1';

async function call(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ai.openaiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    logger.error(`OpenAI ${path} failed: ${res.status} ${detail}`);
    throw new Error(`OpenAI request failed (${res.status})`);
  }
  return res.json();
}

export async function embedText(text) {
  const json = await call('/embeddings', { model: env.ai.openaiEmbedModel, input: text });
  return { embedding: json.data[0].embedding, model: env.ai.openaiEmbedModel };
}

export async function chat({ system = '', prompt = '', context = '' } = {}) {
  const messages = [
    { role: 'system', content: system || 'You are a helpful placement-preparation assistant.' },
    { role: 'user', content: context ? `${prompt}\n\nContext:\n${context}` : prompt },
  ];
  const json = await call('/chat/completions', {
    model: env.ai.openaiChatModel,
    messages,
    temperature: 0.4,
  });
  return { text: json.choices[0].message.content, provider: 'openai' };
}
