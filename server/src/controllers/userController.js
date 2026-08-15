import { User } from '../models/User.js';
import { Blog } from '../models/Blog.js';
import { Follow } from '../models/interactions.js';
import { Report } from '../models/Report.js';
import { ok, created, asyncHandler } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { redactAnonymous } from '../services/blogQueryService.js';
import { BLOG_STATUS } from '../config/constants.js';

/* Public author profile + their published blogs. */
export const authorProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) throw ApiError.notFound('User not found');
  const [blogs, followers, following] = await Promise.all([
    Blog.find({ author: user._id, status: BLOG_STATUS.PUBLISHED, isAnonymous: false })
      .sort({ publishedAt: -1 }).limit(20).lean(),
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
  ]);
  let isFollowing = false;
  if (req.user) isFollowing = !!(await Follow.exists({ follower: req.user._id, following: user._id }));
  ok(res, {
    author: {
      id: user._id, name: user.name, avatar: user.avatar, bio: user.bio,
      role: user.role, department: user.department, isDemo: user.isDemo,
    },
    blogs: blogs.map(redactAnonymous),
    stats: { followers, following, blogs: blogs.length },
    isFollowing,
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ['name', 'bio', 'avatar', 'department', 'year', 'graduationYear', 'skills'];
  const update = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
  ok(res, { user: user.toPublicJSON() }, 'Profile updated');
});

/* Analytics for the current user's own blogs. */
export const myAnalytics = asyncHandler(async (req, res) => {
  const authorId = req.user._id;
  const [totals] = await Blog.aggregate([
    { $match: { author: authorId } },
    { $group: { _id: null, blogs: { $sum: 1 }, views: { $sum: '$views' },
      likes: { $sum: '$likeCount' }, comments: { $sum: '$commentCount' },
      bookmarks: { $sum: '$bookmarkCount' } } },
  ]);
  const perBlog = await Blog.find({ author: authorId })
    .select('title slug views likeCount commentCount bookmarkCount status publishedAt')
    .sort({ views: -1 }).limit(20).lean();
  ok(res, {
    totals: totals || { blogs: 0, views: 0, likes: 0, comments: 0, bookmarks: 0 },
    perBlog,
  });
});

/* Report inappropriate content. */
export const report = asyncHandler(async (req, res) => {
  const { targetType, blog, comment, reason } = req.body;
  const doc = await Report.create({
    reporter: req.user._id, targetType, blog, comment, reason, source: 'user',
  });
  created(res, { report: doc }, 'Report submitted for review');
});
