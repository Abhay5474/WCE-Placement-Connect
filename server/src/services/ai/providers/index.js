import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import * as mock from './mockProvider.js';
import * as gemini from './geminiProvider.js';
import * as groq from './groqProvider.js';

/* Provider selection is split by capability so we can mix providers:
   - CHAT/LLM (summaries, assistant, grammar): mock | gemini | groq
   - EMBEDDINGS (semantic search, RAG retrieval): mock | gemini
     (Groq has no embeddings API, so it is never the embed provider.)
   A provider chosen without its key falls back to mock, and any runtime failure
   (e.g. an invalid key) also falls back to mock, so the app never fully breaks. */

function pickChat() {
  switch (env.ai.provider) {
    case 'gemini':
      if (env.ai.geminiKey) return gemini;
      logger.warn('AI_PROVIDER=gemini but GEMINI_API_KEY missing — chat uses mock');
      return mock;
    case 'groq':
      if (env.ai.groqKey) return groq;
      logger.warn('AI_PROVIDER=groq but GROQ_API_KEY missing — chat uses mock');
      return mock;
    default:
      return mock;
  }
}

function pickEmbed() {
  if (env.ai.embedProvider === 'mock') return mock;
  if (env.ai.geminiKey) return gemini;
  if (env.ai.embedProvider === 'gemini') {
    logger.warn('EMBEDDING_PROVIDER=gemini but GEMINI_API_KEY missing — embeddings use mock');
  }
  return mock;
}

const chatProvider = pickChat();
const embedProvider = pickEmbed();

const nameOf = (p) => (p === gemini ? 'gemini' : p === groq ? 'groq' : 'mock');
export const providerName = nameOf(chatProvider);
export const embedProviderName = nameOf(embedProvider);

// Warn once at startup if a runtime provider is selected but its embeddings can't work.
if (embedProvider !== mock) logger.info(`Embeddings provider: ${embedProviderName}`);

export async function chat(args) {
  try {
    return await chatProvider.chat(args);
  } catch (err) {
    if (chatProvider === mock) throw err;
    logger.error(`Chat provider "${providerName}" failed: ${err.message} — falling back to mock`);
    return mock.chat(args);
  }
}

export async function embedText(text) {
  try {
    return await embedProvider.embedText(text);
  } catch (err) {
    if (embedProvider === mock) throw err;
    logger.error(`Embedding provider "${embedProviderName}" failed: ${err.message} — falling back to mock`);
    return mock.embedText(text);
  }
}

// Deterministic extractive helper (used by heuristic modules regardless of provider).
export const summarizeExtractive = mock.summarizeText;
