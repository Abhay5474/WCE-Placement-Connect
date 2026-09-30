import { Blog } from '../models/Blog.js';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { Like, Bookmark } from '../models/interactions.js';
import { ReadingHistory } from '../models/tracking.js';
import * as blogService from '../services/blogService.js';
import { listBlogs, redactAnonymous } from '../services/blogQueryService.js';
import { ok, created, asyncHandler } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { BLOG_STATUS, ROLES } from '../config/constants.js';

export const create = asyncHandler(async (req, res) =>
  created(res, { blog: await blogService.createBlog(req.user, req.body) }, 'Blog saved')
);

export const update = asyncHandler(async (req, res) =>
  ok(res, { blog: await blogService.updateBlog(req.user, req.params.id, req.body) }, 'Blog updated')
);

export const remove = asyncHandler(async (req, res) => {
  await blogService.deleteBlog(req.user, req.params.id);
  ok(res, null, 'Blog deleted');
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await listBlogs(req.query);
  ok(res, items, 'OK', 200, meta);
});

export const myBlogs = asyncHandler(async (req, res) => {
  const base = { author: req.user._id };
  if (req.query.status) base.status = req.query.status;
  const { items, meta } = await listBlogs(req.query, { base });
  ok(res, items, 'OK', 200, meta);
});

export const getBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug })
    .populate('author', 'name avatar role bio department')
    .populate('placement.company', 'name slug logo')
    .lean();
  if (!blog) throw ApiError.notFound('Blog not found');

  // Drafts are visible only to the author/admin.
  const isOwner = req.user && String(blog.author._id) === String(req.user._id);
  if (blog.status !== BLOG_STATUS.PUBLISHED && !isOwner && req.user?.role !== ROLES.ADMIN) {
    throw ApiError.notFound('Blog not found');
  }

  // Count a view and record reading history (once per request).
  await Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } });
  if (req.user) {
    await ReadingHistory.create({ user: req.user._id, blog: blog._id }).catch(() => {});
  }

  const [ai, questions, liked, bookmarked] = await Promise.all([
    AIAnalysis.findOne({ blog: blog._id }).select('summary quickSummary qualityScore keywords provider').lean(),
    InterviewQuestion.find({ sourceBlogs: blog._id }).select('question topic difficulty').lean(),
    req.user ? Like.exists({ user: req.user._id, blog: blog._id }) : null,
    req.user ? Bookmark.exists({ user: req.user._id, blog: blog._id }) : null,
  ]);

  ok(res, {
    blog: redactAnonymous(blog),
    ai: ai ? { ...ai, aiGenerated: true } : null,
    interviewQuestions: questions,
    viewer: { liked: !!liked, bookmarked: !!bookmarked },
  });
});

/* Related blogs — same company or shared tags. */
export const related = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).lean();
  if (!blog) throw ApiError.notFound('Blog not found');
  const items = await Blog.find({
    _id: { $ne: blog._id },
    status: BLOG_STATUS.PUBLISHED,
    $or: [
      { 'placement.company': blog.placement?.company },
      { tags: { $in: blog.tags || [] } },
      { categories: { $in: blog.categories || [] } },
    ],
  })
    .sort({ likeCount: -1 })
    .limit(6)
    .populate('author', 'name avatar')
    .lean();
  ok(res, items.map(redactAnonymous));
});

export const verify = asyncHandler(async (req, res) =>
  ok(res, { blog: await blogService.verifyBlog(req.user, req.params.id, req.body.level) }, 'Trust level updated')
);

export const highlight = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(
    req.params.id,
    { highlighted: !!req.body.highlighted },
    { new: true }
  );
  if (!blog) throw ApiError.notFound('Blog not found');
  ok(res, { blog }, 'Blog highlight updated');
});
