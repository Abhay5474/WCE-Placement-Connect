import { PlacementProfile } from '../models/PlacementProfile.js';
import { Blog } from '../models/Blog.js';
import { Company } from '../models/Company.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { Bookmark } from '../models/interactions.js';
import { ReadingHistory } from '../models/tracking.js';
import { recommendForUser } from '../services/ai/recommender.js';
import { redactAnonymous } from '../services/blogQueryService.js';
import { ok, asyncHandler } from '../utils/apiResponse.js';
import { BLOG_STATUS } from '../config/constants.js';

/* ---- Placement Profile ---- */
export const getProfile = asyncHandler(async (req, res) => {
  let profile = await PlacementProfile.findOne({ user: req.user._id })
    .populate('targetCompanies', 'name slug logo')
    .lean();
  if (!profile) profile = { user: req.user._id, skills: [], targetRoles: [], targetCompanies: [], preparationProgress: [] };
  ok(res, { profile });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await PlacementProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: { ...req.body, user: req.user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  ok(res, { profile }, 'Placement profile updated');
});

/* ---- Placement Preparation Dashboard ---- */
export const dashboard = asyncHandler(async (req, res) => {
  const [profile, recommended, questions, bookmarks, recent] = await Promise.all([
    PlacementProfile.findOne({ user: req.user._id }).populate('targetCompanies', 'name slug logo').lean(),
    recommendForUser(req.user._id, { limit: 6 }),
    InterviewQuestion.find().sort({ frequency: -1 }).limit(8).lean(),
    Bookmark.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(6)
      .populate({ path: 'blog', populate: { path: 'author', select: 'name avatar' } }).lean(),
    ReadingHistory.find({ user: req.user._id }).sort({ viewedAt: -1 }).limit(6)
      .populate({ path: 'blog', populate: { path: 'author', select: 'name avatar' } }).lean(),
  ]);

  const recommendedCompanies = await Company.find(
    profile?.targetCompanies?.length ? { _id: { $in: profile.targetCompanies } } : {}
  ).limit(6).lean();

  ok(res, {
    profile: profile || null,
    recommendedBlogs: recommended.map(redactAnonymous),
    recommendedCompanies,
    interviewQuestions: questions,
    savedResources: profile?.savedResources || [],
    recentlyViewed: recent.map((r) => r.blog).filter(Boolean).map(redactAnonymous),
    preparationProgress: profile?.preparationProgress || [],
    bookmarks: bookmarks.map((b) => b.blog).filter(Boolean).map(redactAnonymous),
  });
});

/* ---- Placement Hub (public landing) ---- */
export const hub = asyncHandler(async (req, res) => {
  const pub = { status: BLOG_STATUS.PUBLISHED };
  const [latest, trendingCompanies, popularQuestions, recentlyAdded, mostHelpful, companies] = await Promise.all([
    Blog.find({ ...pub, type: 'placement' }).sort({ publishedAt: -1 }).limit(8).populate('author', 'name avatar').lean(),
    Blog.aggregate([
      { $match: { ...pub, 'placement.company': { $ne: null } } },
      { $group: { _id: '$placement.company', name: { $first: '$placement.companyName' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
    ]),
    InterviewQuestion.find().sort({ frequency: -1 }).limit(8).lean(),
    Blog.find(pub).sort({ createdAt: -1 }).limit(6).populate('author', 'name avatar').lean(),
    Blog.find(pub).sort({ bookmarkCount: -1, likeCount: -1 }).limit(6).populate('author', 'name avatar').lean(),
    Company.find().sort({ name: 1 }).limit(12).lean(),
  ]);

  ok(res, {
    latestExperiences: latest.map(redactAnonymous),
    trendingCompanies,
    popularQuestions,
    recentlyAdded: recentlyAdded.map(redactAnonymous),
    mostHelpful: mostHelpful.map(redactAnonymous),
    companies,
  });
});

/* ---- Recommendations ---- */
export const recommendations = asyncHandler(async (req, res) => {
  const items = await recommendForUser(req.user._id, { limit: Number(req.query.limit) || 10 });
  ok(res, items.map(redactAnonymous));
});
