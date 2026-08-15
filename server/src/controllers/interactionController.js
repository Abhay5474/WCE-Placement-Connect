import { Blog } from '../models/Blog.js';
import { Comment, Like, Follow, Bookmark } from '../models/interactions.js';
import { User } from '../models/User.js';
import { ok, created, asyncHandler } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeHtml } from '../utils/sanitize.js';
import { notify } from '../services/notificationService.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { paginate, pageMeta } from '../utils/pagination.js';

/* ---- Comments ---- */
export const addComment = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.blogId).populate('author', 'name');
  if (!blog) throw ApiError.notFound('Blog not found');

  const comment = await Comment.create({
    blog: blog._id,
    author: req.user._id,
    content: sanitizeHtml(req.body.content),
    parent: req.body.parent || null,
  });
  await Blog.updateOne({ _id: blog._id }, { $inc: { commentCount: 1 } });

  // Notify blog author (or parent comment author on replies).
  if (req.body.parent) {
    const parent = await Comment.findById(req.body.parent).select('author');
    if (parent) {
      await notify({
        recipient: parent.author,
        type: NOTIFICATION_TYPES.REPLY,
        actor: req.user._id,
        blog: blog._id,
        message: `${req.user.name} replied to your comment`,
        link: `/blog/${blog.slug}`,
      });
    }
  } else {
    await notify({
      recipient: blog.author._id,
      type: NOTIFICATION_TYPES.COMMENT,
      actor: req.user._id,
      blog: blog._id,
      message: `${req.user.name} commented on "${blog.title}"`,
      link: `/blog/${blog.slug}`,
    });
  }

  const populated = await comment.populate('author', 'name avatar');
  created(res, { comment: populated }, 'Comment added');
});

export const listComments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { blog: req.params.blogId, isDeleted: false };
  const [items, total] = await Promise.all([
    Comment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name avatar').lean(),
    Comment.countDocuments(filter),
  ]);
  ok(res, items, 'OK', 200, pageMeta(page, limit, total));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (String(comment.author) !== String(req.user._id) && req.user.role !== 'admin') {
    throw ApiError.forbidden('Cannot delete this comment');
  }
  comment.isDeleted = true;
  comment.content = '[deleted]';
  await comment.save();
  await Blog.updateOne({ _id: comment.blog }, { $inc: { commentCount: -1 } });
  ok(res, null, 'Comment deleted');
});

/* ---- Likes ---- */
export const toggleLike = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.blogId);
  if (!blog) throw ApiError.notFound('Blog not found');
  const existing = await Like.findOne({ user: req.user._id, blog: blog._id });
  let liked;
  if (existing) {
    await existing.deleteOne();
    await Blog.updateOne({ _id: blog._id }, { $inc: { likeCount: -1 } });
    liked = false;
  } else {
    await Like.create({ user: req.user._id, blog: blog._id });
    await Blog.updateOne({ _id: blog._id }, { $inc: { likeCount: 1 } });
    liked = true;
  }
  ok(res, { liked, likeCount: blog.likeCount + (liked ? 1 : -1) });
});

/* ---- Bookmarks (Save for later) ---- */
export const toggleBookmark = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.blogId);
  if (!blog) throw ApiError.notFound('Blog not found');
  const existing = await Bookmark.findOne({ user: req.user._id, blog: blog._id });
  let bookmarked;
  if (existing) {
    await existing.deleteOne();
    await Blog.updateOne({ _id: blog._id }, { $inc: { bookmarkCount: -1 } });
    bookmarked = false;
  } else {
    await Bookmark.create({ user: req.user._id, blog: blog._id });
    await Blog.updateOne({ _id: blog._id }, { $inc: { bookmarkCount: 1 } });
    bookmarked = true;
  }
  ok(res, { bookmarked });
});

export const myBookmarks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [docs, total] = await Promise.all([
    Bookmark.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'blog', populate: { path: 'author', select: 'name avatar' } })
      .lean(),
    Bookmark.countDocuments({ user: req.user._id }),
  ]);
  ok(res, docs.map((d) => d.blog).filter(Boolean), 'OK', 200, pageMeta(page, limit, total));
});

/* ---- Follow ---- */
export const toggleFollow = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.userId);
  if (!target) throw ApiError.notFound('User not found');
  if (String(target._id) === String(req.user._id)) throw ApiError.badRequest('You cannot follow yourself');

  const existing = await Follow.findOne({ follower: req.user._id, following: target._id });
  let following;
  if (existing) {
    await existing.deleteOne();
    following = false;
  } else {
    await Follow.create({ follower: req.user._id, following: target._id });
    following = true;
    await notify({
      recipient: target._id,
      type: NOTIFICATION_TYPES.NEW_FOLLOWER,
      actor: req.user._id,
      message: `${req.user.name} started following you`,
      link: `/author/${req.user._id}`,
    });
  }
  ok(res, { following });
});
