# WCEConnect AI — Database / ER

MongoDB via Mongoose. Collections and key relationships:

```
User ──1:1── PlacementProfile
 │ └─author─▶ Blog ──1:1── AIAnalysis (summary, embedding, quality, moderation)
 │             │ ├─placement.company ─▶ Company
 │             │ ├─◀ Comment (blog, author, parent)
 │             │ ├─◀ Like (user, blog)  [unique user+blog]
 │             │ ├─◀ Bookmark (user, blog)  [unique user+blog]
 │             │ └─◀ InterviewQuestion (sourceBlogs[])
 │ ├─◀ Follow (follower, following)  [unique pair]
 │ ├─◀ Notification (recipient, actor, blog)
 │ ├─◀ ReadingHistory / SearchHistory
 │ └─◀ Report (reporter, blog|comment, status)
Company ──◀ InterviewQuestion
```

## Models

- **User** — name, email(unique), passwordHash(select:false), role, department, year,
  graduationYear, skills[], isEmailVerified, refreshTokenHashes[](select:false), isDemo.
- **Blog** — title, slug(unique), content(sanitized), author, status(draft/published/archived),
  type(general/placement), categories[], aiSuggestedCategories[], tags[], **placement** subdoc
  (company, role, placementType, year, department, rounds[], difficulty, skills[], result,
  ctc + `fieldVisibility.ctc`), trustLevel(student_submitted/verified/official), engagement
  counters, isAnonymous, highlighted. Text index on title/content/tags/company.
- **Company** — name/slug(unique), industry, roles[], requiredSkills[], difficulty,
  verifiedInformation, aiPreparationSummary (cached).
- **InterviewQuestion** — question, normalized(dedupe key), company/companyName, topic,
  difficulty, round, sourceBlogs[], **frequency = count of distinct source blogs**, verified.
- **PlacementProfile** — user(unique), branch, year, skills[], targetRoles[], targetCompanies[],
  preparationProgress[], savedResources[].
- **AIAnalysis** — blog(unique), contentHash, summary, quickSummary, suggestedTags/Titles,
  qualityScore{}, tone, keywords[], moderation{}, **embedding[]**, provider.
- **Report** — reporter(null if AI), targetType, blog/comment, reason, source(user/ai),
  aiFlags, status(open/reviewing/resolved/dismissed), moderator, resolution.
- **Comment / Like / Follow / Bookmark / Notification / ReadingHistory / SearchHistory** —
  interaction + tracking collections (see `models/interactions.js`, `models/tracking.js`).

## Indexes

Unique: User.email, Blog.slug, Company.name/slug, Like(user,blog), Bookmark(user,blog),
Follow(follower,following), PlacementProfile.user, AIAnalysis.blog.
Text: Blog, Company, InterviewQuestion. Compound: Blog(status, publishedAt),
Blog(placement.company, status), Notification(recipient, read).

## MongoDB Atlas Vector Search (production)

Create a vector index named per `ATLAS_VECTOR_INDEX` on `AIAnalysis.embedding`
(dimensions = your embedding model's size; similarity = cosine) and set `VECTOR_BACKEND=atlas`.
