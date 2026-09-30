# WCEConnect AI — College Placement Knowledge Platform

WCEConnect AI turns scattered student placement experiences into a **structured, searchable, AI-powered institutional knowledge base**. Students share interview experiences, companies, questions and preparation strategies; future batches search, get personalized recommendations, and ask an AI assistant that answers **grounded in real WCEConnect AI content** (RAG) with source citations.

> Built as a final-year mega project — production-oriented, modular, secure and deployable.

---

## ✨ Features

- **Open, public reading** — anyone can browse placement experiences, companies and questions **without an account**.
- **Open registration** with email verification, JWT access + refresh tokens, forgot/reset password. Domain restriction is optional (`RESTRICT_EMAIL_DOMAIN`, off by default).
- **Admin-gated contributing** — adding/publishing an experience requires **contributor access granted by an admin** (users request it; admins approve from the Access Requests panel).
- **Role-based access control** — Student, Faculty, Placement Coordinator, Admin.
- **Placement experience editor** with a structured template (company, rounds, questions, preparation, advice...).
- **Company knowledge base** with dedicated company pages and AI preparation summaries.
- **Interview question database** auto-extracted from experiences, filterable by company/topic/difficulty.
- **AI service layer** (provider-agnostic): writing assistant, summarizer, classifier, tag/title generation, interview extraction, moderation.
- **Semantic search + RAG placement assistant** with blog citations.
- **Hybrid recommendation engine** (content + collaborative + trending).
- **Verification & trust levels** — Student Submitted / Verified / Official.
- **AI-assisted moderation** (flag for review, never auto-delete).
- **Real-time notifications** via Socket.IO.
- **Analytics dashboards** for admins & placement coordinators.

## 🏗️ Architecture

```
client/   React (Vite) + Tailwind + React Query        → UI
server/   Node + Express + Mongoose                     → REST /api/v1/*
  ├─ models/        Mongoose schemas
  ├─ controllers/   thin request handlers
  ├─ services/      business logic
  │   └─ ai/        provider-agnostic AI modules
  ├─ middleware/    auth, rbac, validation, errors
  ├─ routes/        /api/v1 routers
  └─ sockets/       Socket.IO notifications
docs/     API docs, ER + architecture descriptions
```

The AI provider is selected by `AI_PROVIDER` (`mock` | `openai` | `gemini`). The default **`mock`** provider is deterministic and needs no API key, so the platform runs and demos anywhere.

## 🚀 Quick start

```bash
# 1. Backend
cd server
cp .env.example .env          # edit MONGO_URI etc.
npm install
npm run seed                  # optional: demo companies + users (marked DEMO)
npm run dev                   # http://localhost:5000

# 2. Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Requires Node 18+ and a MongoDB instance (local or Atlas). Atlas is recommended for vector search; the app falls back to in-memory cosine similarity for local dev.

## 🌍 Deployment

### Backend on Render

Deploy the `server/` app as a Render Web Service using the included [render.yaml](render.yaml). Set these production values in Render:

| Var | Value |
|-----|-------|
| `CLIENT_URL` | Your Vercel frontend URL, for example `https://wceconnect-ai.vercel.app` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Strong random secret |
| `JWT_REFRESH_SECRET` | Strong random secret |
| `AI_PROVIDER` | `mock`, `gemini`, or `groq` |
| `EMBEDDING_PROVIDER` | `mock` or `gemini` |

The Render service listens on `PORT` automatically and exposes `/health` for the health check.

### Frontend on Vercel

Deploy the `client/` app on Vercel with the included [client/vercel.json](client/vercel.json). Set these environment variables in Vercel:

| Var | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL plus `/api/v1`, for example `https://wceconnect-ai-server.onrender.com/api/v1` |
| `VITE_SOCKET_URL` | Your Render backend URL, for example `https://wceconnect-ai-server.onrender.com` |

After both deployments are live, confirm the backend `CLIENT_URL` points to the Vercel domain so auth cookies and Socket.IO CORS work correctly.

## 🔑 Environment variables

See [`server/.env.example`](server/.env.example) and [`client/.env.example`](client/.env.example). Key ones:

| Var | Purpose |
|-----|---------|
| `COLLEGE_EMAIL_DOMAIN` | institutional email domain allowed to register |
| `AI_PROVIDER` | `mock` \| `openai` \| `gemini` |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | provider keys (never sent to frontend) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | token signing |

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database / ER](docs/DATABASE.md)
- [Testing checklist](docs/TESTING.md)

## ⚠️ Note on data

Seed data is **clearly marked DEMO/SAMPLE**. Fabricated placement experiences are never presented as real student experiences. AI-generated content is always labeled as AI-generated.
