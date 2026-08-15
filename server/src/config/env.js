import dotenv from 'dotenv';
dotenv.config();

const bool = (v, def = false) =>
  v === undefined ? def : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wceconnect_ai',

  collegeEmailDomain: (process.env.COLLEGE_EMAIL_DOMAIN || 'walchandcollege.edu.in').toLowerCase(),
  institutionName: process.env.INSTITUTION_NAME || 'Walchand College of Engineering',
  requireEmailVerification: bool(process.env.REQUIRE_EMAIL_VERIFICATION, false),

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  ai: {
    provider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
    openaiKey: process.env.OPENAI_API_KEY || '',
    openaiChatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    openaiEmbedModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
    geminiKey: process.env.GEMINI_API_KEY || '',
    geminiChatModel: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
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
