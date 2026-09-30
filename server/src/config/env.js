import dotenv from 'dotenv';
// override:true makes the .env file authoritative, so a stale OS/user environment
// variable (e.g. a leftover GEMINI_API_KEY) can never shadow the value in .env.
// In production without a .env file this is a no-op.
dotenv.config({ override: true });

const bool = (v, def = false) =>
  v === undefined ? def : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wceconnect_ai',
  // Database name applied via the driver, so the URI need not include one.
  mongoDbName: process.env.MONGO_DB || 'wceconnect_ai',
  // Optional public DNS servers for Node's resolver. Needed on networks whose
  // local DNS refuses the SRV lookup that mongodb+srv:// requires.
  dnsServers: (process.env.DNS_SERVERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  collegeEmailDomain: (process.env.COLLEGE_EMAIL_DOMAIN || 'walchandcollege.edu.in').toLowerCase(),
  institutionName: process.env.INSTITUTION_NAME || 'Walchand College of Engineering',
  requireEmailVerification: bool(process.env.REQUIRE_EMAIL_VERIFICATION, false),
  // When false (default) any email domain may register. Reading is public;
  // contributing placement experiences still requires admin-granted access.
  restrictEmailDomain: bool(process.env.RESTRICT_EMAIL_DOMAIN, false),

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  ai: {
    // Chat/LLM provider: mock | gemini | groq
    provider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
    // Embedding provider (Groq has no embeddings API, so it's resolved separately).
    // mock | gemini. If blank, auto-picks gemini when a key exists.
    embedProvider: (process.env.EMBEDDING_PROVIDER || '').toLowerCase(),
    geminiKey: process.env.GEMINI_API_KEY || '',
    geminiChatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
    geminiEmbedModel: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
    groqKey: process.env.GROQ_API_KEY || '',
    groqChatModel: process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-20b',
    // Reasoning models (gpt-oss) burn extra tokens "thinking"; 'low' keeps quality
    // while minimizing token use so the free tier isn't exhausted. Blank to omit.
    groqReasoningEffort: process.env.GROQ_REASONING_EFFORT ?? 'low',
    // Hard cap on output tokens per request (safety against runaway usage).
    groqMaxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '1024', 10),
    rateLimit: parseInt(process.env.AI_RATE_LIMIT || '30', 10),
  },

  vector: {
    backend: (process.env.VECTOR_BACKEND || 'local').toLowerCase(),
    atlasIndex: process.env.ATLAS_VECTOR_INDEX || 'vector_index',
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'no-reply@wceconnect.ai',
  },
};

export default env;
