import { Blog } from '../../models/Blog.js';
import { Follow, Like, Bookmark } from '../../models/interactions.js';
import { ReadingHistory } from '../../models/tracking.js';
import { PlacementProfile } from '../../models/PlacementProfile.js';
import { BLOG_STATUS } from '../../config/constants.js';

/* Hybrid recommender: content-based (profile/skills/history overlap) +
   collaborative signals (followed authors, popular among peers) + trending
   (recent engagement). Deliberately a practical ranking system, not a heavy DL model.
   Each recommendation carries an `reasons` array for explainability. */

function overlap(a = [], b = []) {
  const setB = new Set(b.map((x) => String(x).toLowerCase()));
  return a.filter((x) => setB.has(String(x).toLowerCase())).length;
}

export async function recommendForUser(userId, { limit = 10 } = {}) {
  const [profile, followingDocs, history, likes] = await Promise.all([
    PlacementProfile.findOne({ user: userId }).lean(),
    Follow.find({ follower: userId }).select('following').lean(),
    ReadingHistory.find({ user: userId }).sort({ viewedAt: -1 }).limit(50).select('blog').lean(),
    Like.find({ user: userId }).select('blog').lean(),
  ]);

  const followedAuthors = new Set(followingDocs.map((f) => String(f.following)));
  const seen = new Set([...history.map((h) => String(h.blog)), ...likes.map((l) => String(l.blog))]);
  const userSkills = profile?.skills || [];
  const targetCompanies = new Set((profile?.targetCompanies || []).map(String));

  // Candidate pool: recent published blogs the user hasn't seen.
  const candidates = await Blog.find({ status: BLOG_STATUS.PUBLISHED, _id: { $nin: [...seen] } })
    .sort({ publishedAt: -1 })
    .limit(200)
    .populate('author', 'name avatar')
    .lean();

  const now = Date.now();
  const scored = candidates.map((b) => {
    const reasons = [];
    let score = 0;

    const skillMatch = overlap(userSkills, [...(b.tags || []), ...(b.placement?.skills || [])]);
    if (skillMatch) { score += skillMatch * 3; reasons.push(`matches ${skillMatch} of your skills`); }

    if (profile?.branch && b.placement?.department === profile.branch) {
      score += 2; reasons.push('same branch');
    }
    if (b.placement?.company && targetCompanies.has(String(b.placement.company))) {
      score += 4; reasons.push('a target company');
    }
    if (followedAuthors.has(String(b.author?._id))) {
      score += 3; reasons.push('by an author you follow');
    }

    // Trending: engagement decayed by age (days).
    const ageDays = Math.max(1, (now - new Date(b.publishedAt || b.createdAt)) / 86400000);
    const trending = (b.likeCount + b.commentCount + b.views / 10) / ageDays;
    score += Math.min(5, trending);
    if (trending > 2) reasons.push('trending now');

    if (b.trustLevel === 'verified' || b.trustLevel === 'official') {
      score += 1.5; reasons.push('verified content');
    }

    return { blog: b, score, reasons: reasons.length ? reasons : ['recent placement content'] };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => ({ ...r.blog, _recommendation: { score: Math.round(r.score * 10) / 10, reasons: r.reasons } }));
}
