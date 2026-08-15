# WCEConnect AI — Architecture

## Overview

A MERN monorepo split into `client/` (React) and `server/` (Express). The backend follows a
layered **clean architecture**: routes → controllers (thin) → services (business logic) →
models. AI lives in a dedicated, provider-agnostic service layer so no AI call is hard-coded
into a controller.

```
┌────────────┐    REST /api/v1     ┌──────────────────────────────────────┐
│  React SPA │ ─────────────────▶  │            Express API               │
│ (Vite/Tail)│ ◀── Socket.IO ────  │  routes → controllers → services     │
└────────────┘                     │                          │           │
                                   │              ┌───────────▼─────────┐ │
                                   │              │  AI service layer   │ │
                                   │              │  providers: mock /  │ │
                                   │              │  openai / gemini    │ │
                                   │              └───────────┬─────────┘ │
                                   │                          │           │
                                   │   Mongoose models   ┌────▼────┐      │
                                   └─────────────────────│ MongoDB │──────┘
                                                         │ +Vector │
                                                         └─────────┘
```

## AI provider abstraction

`services/ai/providers/index.js` selects a provider from `AI_PROVIDER` and exposes two
primitives: `chat()` and `embedText()`. If a real provider is selected without an API key,
it transparently falls back to the deterministic **mock** provider so the app always runs.
Higher-level modules (`writingAssistant`, `classifier`, `summarizer`, `interviewAnalyzer`,
`moderation`, `semanticSearch`, `preparationAssistant`, `recommender`) build on those
primitives plus deterministic NLP heuristics.

## AI cost control

`services/aiPipeline.js` caches per-blog analysis in the `AIAnalysis` collection keyed by a
content hash. Embeddings and summaries are only regenerated when content changes, and the
pipeline runs asynchronously (`setImmediate`) so requests are never blocked by AI latency.
AI endpoints are additionally rate-limited.

## Semantic search & RAG

1. Blog text → `embedText()` → vector stored on `AIAnalysis.embedding`.
2. `vectorStore.js` runs similarity search — MongoDB Atlas `$vectorSearch` when
   `VECTOR_BACKEND=atlas`, else in-memory cosine similarity for local dev.
3. The RAG assistant (`preparationAssistant.js`) retrieves top blogs, builds a bounded
   context, calls the LLM with a grounding system prompt, and returns the answer **with
   citations**. If retrieval is empty it says so instead of hallucinating.

## Security

helmet, CORS (credentialed), express-mongo-sanitize, xss sanitization of authored HTML,
Joi validation on every mutating route, JWT access + rotating refresh tokens, bcrypt(12),
role middleware, per-route rate limits, request size limits. API keys stay server-side.

## Real-time

`sockets/index.js` authenticates the socket via the access token and joins a `user:<id>`
room; `notificationService.js` persists a notification and emits it to that room.
