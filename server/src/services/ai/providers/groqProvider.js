import { env } from '../../../config/env.js';

/* Groq adapter — OpenAI-compatible Chat Completions API, very fast inference for
   Llama models. Groq does NOT offer an embeddings endpoint, so embeddings are
   resolved to a different provider (Gemini/mock) by the selector. */

const BASE = 'https://api.groq.com/openai/v1';

async function readError(res) {
  try {
    const json = JSON.parse(await res.text());
    return json?.error?.message || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function chat({ system = '', prompt = '', context = '' } = {}) {
  const messages = [
    { role: 'system', content: system || 'You are a helpful placement-preparation assistant.' },
    { role: 'user', content: context ? `${prompt}\n\nContext:\n${context}` : prompt },
  ];
  const body = {
    model: env.ai.groqChatModel,
    messages,
    temperature: 0.4,
    max_tokens: env.ai.groqMaxTokens,
  };
  // reasoning_effort only applies to reasoning models (gpt-oss); include it when
  // configured and the model supports it, to keep token usage low.
  if (env.ai.groqReasoningEffort && /gpt-oss/i.test(env.ai.groqChatModel)) {
    body.reasoning_effort = env.ai.groqReasoningEffort;
  }
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.ai.groqKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Groq chat: ${await readError(res)}`);
  const json = await res.json();
  return { text: json.choices?.[0]?.message?.content || '', provider: 'groq' };
}

// Not supported by Groq — the provider selector routes embeddings elsewhere.
export async function embedText() {
  throw new Error('Groq does not provide an embeddings API');
}
