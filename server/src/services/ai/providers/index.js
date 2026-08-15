import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import * as mock from './mockProvider.js';
import * as openai from './openaiProvider.js';
import * as gemini from './geminiProvider.js';

/* Selects the active AI provider from env, falling back to the mock provider when
   a real provider is chosen but its API key is missing. This keeps the app running
   in every environment while allowing a drop-in production provider. */
function pick() {
  switch (env.ai.provider) {
    case 'openai':
      if (env.ai.openaiKey) return openai;
      logger.warn('AI_PROVIDER=openai but OPENAI_API_KEY missing — using mock provider');
      return mock;
    case 'gemini':
      if (env.ai.geminiKey) return gemini;
      logger.warn('AI_PROVIDER=gemini but GEMINI_API_KEY missing — using mock provider');
      return mock;
    case 'mock':
    default:
      return mock;
  }
}

export const provider = pick();
export const providerName = env.ai.provider && provider !== mock ? env.ai.provider : 'mock';

export const chat = (args) => provider.chat(args);
export const embedText = (text) => provider.embedText(text);

// Mock exposes deterministic extractive helpers reused by heuristic modules.
export const summarizeExtractive = mock.summarizeText;
