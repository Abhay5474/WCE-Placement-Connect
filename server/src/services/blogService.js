import { Blog } from '../models/Blog.js';
import { Company } from '../models/Company.js';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { Follow } from '../models/interactions.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slug.js';
import { sanitizeHtml } from '../utils/sanitize.js';
import { readingTimeMin } from './ai/textStats.js';
import { classify } from './ai/classifier.js';
import { processBlogAIAsync } from './aiPipeline.js';
import { notifyMany } from './notificationService.js';
import { BLOG_STATUS, TRUST_LEVELS, ROLES, NOTIFICATION_TYPES } from '../config/constants.js';

/* Resolves a company name to a Company doc, creating a lightweight record if it
   does not yet exist (so experiences for new companies still link correctly). */
async function resolveCompany(name, userId) {
  if (!name) return null;
  const trimmed = name.trim();
  let company = await Company.findOne({ name: new RegExp(`^${trimmed}$`, 'i') });
  if (!company) {
    company = await Company.create({ name: trimmed, slug: uniqueSlug(trimmed), createdBy: userId });
  }
  return company;
}

function buildExcerpt(content) {
  return sanitizeHtml(content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220);
}

export async function createBlog(user, payload) {
  const content = sanitizeHtml(payload.content);
  const isPlacement = payload.type === 'placement';

  let placement;
  if (isPlacement && payload.placement) {
    const company = await resolveCompany(payload.placement.companyName, user._id);
    placement = {
      ...payload.placement,
      company: company?._id,
      companyName: company?.name || payload.placement.companyName,
    };
  }

  const text = `${payload.title}\n${content}`;
  const blog = await Blog.create({
    title: payload.title,
    slug: uniqueSlug(payload.title),
    content,
    excerpt: buildExcerpt(content),
    coverImage: payload.coverImage || '',
    author: user._id,
    isAnonymous: !!payload.isAnonymous,
    status: payload.status === BLOG_STATUS.PUBLISHED ? BLOG_STATUS.PUBLISHED : BLOG_STATUS.DRAFT,
    type: isPlacement ? 'placement' : 'general',
    categories: payload.categories || [],
    aiSuggestedCategories: classify(text).categories,
    tags: payload.tags || [],
    placement,
    readingTimeMin: readingTimeMin(content),
    publishedAt: payload.status === BLOG_STATUS.PUBLISHED ? new Date() : undefined,
  });

  processBlogAIAsync(blog);
  if (blog.status === BLOG_STATUS.PUBLISHED) await notifyFollowers(blog, user);
  return blog;
}

export async function updateBlog(user, id, payload) {
  const blog = await Blog.findById(id);
  if (!blog) throw ApiError.notFound('Blog not found');
  if (String(blog.author) !== String(user._id) && user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only edit your own blogs');
  }

  const wasPublished = blog.status === BLOG_STATUS.PUBLISHED;

  if (payload.title) { blog.title = payload.title; }
  if (payload.content !== undefined) {
    blog.content = sanitizeHtml(payload.content);
    blog.excerpt = buildExcerpt(blog.content);
    blog.readingTimeMin = readingTimeMin(blog.content);
  }
  if (payload.coverImage !== undefined) blog.coverImage = payload.coverImage;
  if (payload.tags) blog.tags = payload.tags;
  if (payload.categories) blog.categories = payload.categories;
  if (payload.isAnonymous !== undefined) blog.isAnonymous = payload.isAnonymous;

  if (payload.placement) {
    const company = await resolveCompany(payload.placement.companyName, user._id);
    blog.type = 'placement';
    blog.placement = {
      ...(blog.placement?.toObject?.() || blog.placement || {}),
      ...payload.placement,
      company: company?._id,
      companyName: company?.name || payload.placement.companyName,
    };
  }

  if (payload.status && [BLOG_STATUS.DRAFT, BLOG_STATUS.PUBLISHED, BLOG_STATUS.ARCHIVED].includes(payload.status)) {
    blog.status = payload.status;
    if (payload.status === BLOG_STATUS.PUBLISHED && !blog.publishedAt) blog.publishedAt = new Date();
  }

  await blog.save();
  processBlogAIAsync(blog, { force: true });
  if (!wasPublished && blog.status === BLOG_STATUS.PUBLISHED) await notifyFollowers(blog, user);
  return blog;
}

export async function deleteBlog(user, id) {
  const blog = await Blog.findById(id);
  if (!blog) throw ApiError.notFound('Blog not found');
  if (String(blog.author) !== String(user._id) && user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only delete your own blogs');
  }
  await Promise.all([blog.deleteOne(), AIAnalysis.deleteOne({ blog: blog._id })]);
  return { success: true };
}

async function notifyFollowers(blog, author) {
  const followers = await Follow.find({ following: author._id }).select('follower').lean();
  if (!followers.length) return;
  await notifyMany(
    followers.map((f) => f.follower),
    {
      type: NOTIFICATION_TYPES.BLOG_PUBLISHED,
      actor: author._id,
      blog: blog._id,
      message: `${author.name} published "${blog.title}"`,
      link: `/blog/${blog.slug}`,
    }
  );
}

/* Coordinator/faculty verification. */
export async function verifyBlog(moderator, id, level) {
  const blog = await Blog.findById(id).populate('author', 'name');
  if (!blog) throw ApiError.notFound('Blog not found');
  const allowed = [TRUST_LEVELS.STUDENT_SUBMITTED, TRUST_LEVELS.VERIFIED, TRUST_LEVELS.OFFICIAL];
  if (!allowed.includes(level)) throw ApiError.badRequest('Invalid trust level');
  blog.trustLevel = level;
  blog.verifiedBy = moderator._id;
  blog.verifiedAt = new Date();
  await blog.save();
  if (level !== TRUST_LEVELS.STUDENT_SUBMITTED) {
    await notifyMany([blog.author._id], {
      type: NOTIFICATION_TYPES.BLOG_VERIFIED,
      actor: moderator._id,
      blog: blog._id,
      message: `Your blog "${blog.title}" was marked as ${level.replace('_', ' ')}`,
      link: `/blog/${blog.slug}`,
    });
  }
  return blog;
}
