# WCEConnect AI — API Documentation

Base URL: `/api/v1`. All responses use a consistent envelope:

```json
{ "success": true, "message": "OK", "data": { ... }, "meta": { ... } }
```
Errors: `{ "success": false, "message": "...", "errors": { field: msg } }`.

Auth: send `Authorization: Bearer <accessToken>`. Refresh tokens are stored in an httpOnly cookie and rotated via `POST /auth/refresh`.

## Auth `/auth`
| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/register` | – | name, email(@college domain), password, department?, year? |
| POST | `/verify-email` | – | email, token |
| POST | `/login` | – | email, password |
| POST | `/refresh` | cookie | – |
| POST | `/logout` | ✓ | – |
| GET | `/me` | ✓ | – |
| POST | `/forgot-password` | – | email |
| POST | `/reset-password` | – | email, token, password |
| POST | `/change-password` | ✓ | currentPassword, newPassword |

## Blogs `/blogs`
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | opt | list + filters (`q, company, role, department, year, placementType, difficulty, category, tag, verified, sort, page, limit`) |
| GET | `/mine` | ✓ | own blogs (filter `status`) |
| POST | `/` | ✓ | create (see model) |
| GET | `/:slug` | opt | full blog + AI summary + questions + viewer state |
| GET | `/:slug/related` | – | related blogs |
| PATCH | `/:id` | ✓ owner/admin | update |
| DELETE | `/:id` | ✓ owner/admin | delete |
| POST | `/:id/verify` | faculty/coordinator/admin | `{ level }` trust level |
| POST | `/:id/highlight` | coordinator/admin | `{ highlighted }` |

## Interactions
`POST /blogs/:blogId/comments`, `GET /blogs/:blogId/comments`, `DELETE /comments/:id`,
`POST /blogs/:blogId/like`, `POST /blogs/:blogId/bookmark`, `GET /bookmarks`,
`POST /users/:userId/follow` — all require auth (except listing comments).

## Companies `/companies`
`GET /`, `GET /compare?slugs=a,b`, `GET /:slug`, `GET /:slug/prep-summary` (AI, cached).
Manage (coordinator/admin): `POST /`, `PATCH /:id`, `DELETE /:id`.

## Interview Questions `/interview-questions`
`GET /` (filters: company, topic, difficulty, role, round, q), `GET /frequent`, `POST /:id/verify`.

## Search `/search`
`GET /?q=...&mode=keyword|semantic` — semantic uses embeddings + vector search, falls back to keyword.

## AI `/ai` (auth + rate-limited)
| Method | Path | Body | Purpose |
|--------|------|------|---------|
| POST | `/analyze` | title, content | tags, titles, quality, tone, readability, grammar |
| POST | `/moderation-check` | title, content | PII + policy flags (advisory) |
| POST | `/assistant` | query | RAG answer + citations |
| POST | `/blogs/:id/reprocess` | – | force re-run AI pipeline |
| GET | `/blogs/:id/analysis` | – | cached analysis |

## Placement `/placement`
`GET /hub` (public), `GET /profile`, `PUT /profile`, `GET /dashboard`, `GET /recommendations` (auth).

## Users `/users`
`GET /:id` (author profile), `PATCH /me`, `GET /me/analytics`, `POST /reports`.

## Notifications `/notifications`
`GET /`, `POST /read-all`, `POST /:id/read`.

## Admin `/admin`
`GET /analytics` (admin/coordinator), `GET /reports`, `POST /reports/:id/resolve`,
`GET /flagged`, `GET /users` (admin), `PATCH /users/:id/role`, `PATCH /users/:id/active`.

## Real-time (Socket.IO)
Connect to `VITE_SOCKET_URL` with `auth: { token }`. Server emits `notification` events to the user's room.
