# WCEConnect AI — Testing

## Automated

```bash
cd server && npm test
```

- `tests/ai.unit.test.js` — pure AI-logic tests (classifier, tag extraction, quality score,
  interview-question extraction, moderation/PII, vector similarity). Run anywhere, no DB.
- `tests/api.test.js` — end-to-end API flow via `mongodb-memory-server` + supertest
  (register → create placement blog → AI pipeline → list → semantic search → RAG assistant →
  RBAC/security). These auto-skip when a MongoDB binary cannot be downloaded (sandbox);
  run locally/CI with network access or set `MONGOMS_SYSTEM_BINARY` to a mongod path.

## Manual checklist

### Authentication
- [ ] Register rejects non-`@COLLEGE_EMAIL_DOMAIN` emails.
- [ ] Register with a college email logs in (or requires verification if enabled).
- [ ] Login / logout / refresh work; forgot + reset password work (link logged to console in dev).

### Placement
- [ ] Create placement experience with structured fields; insert template.
- [ ] Save draft; publish; edit; delete own blog.
- [ ] Filters (company/category/verified/sort) and keyword + semantic search return results.

### AI
- [ ] Writing assistant returns tags, titles, quality score, tone, grammar hints.
- [ ] Moderation warns when a phone number / email is present (PII).
- [ ] Blog detail shows AI quick summary labeled "AI-generated".
- [ ] Interview questions are extracted and appear under the blog and in `/interview-questions`.
- [ ] AI assistant answers with citations, or states insufficient content (no hallucination).

### Security
- [ ] Unauthenticated blog creation → 401.
- [ ] Student hitting `/admin/users` → 403.
- [ ] Invalid/oversized input → 400 with field errors.
- [ ] Authored HTML with `<script>` is stripped.

### Roles
- [ ] Coordinator can verify/highlight blogs, manage companies, view analytics.
- [ ] Admin can change roles, disable users, resolve reports.

### Real-time
- [ ] Following a user / commenting produces a live notification (bell badge updates).
