import { Blog } from '../models/Blog.js';
import { BLOG_STATUS } from '../config/constants.js';
import { paginate, pageMeta } from '../utils/pagination.js';

/* Builds a Mongo filter from query params (keyword + placement filters). */
export function buildFilter(query, base = {}) {
  const filter = { ...base };
  const {
    q, company, role, department, year, placementType, topic, difficulty,
    skills, author, verified, category, tag, type,
  } = query;

  if (q) filter.$text = { $search: q };
  if (company) filter['placement.companyName'] = new RegExp(company, 'i');
  if (role) filter['placement.role'] = new RegExp(role, 'i');
  if (department) filter['placement.department'] = new RegExp(department, 'i');
  if (year) filter['placement.year'] = Number(year);
  if (placementType) filter['placement.placementType'] = placementType;
  if (difficulty) filter['placement.difficulty'] = difficulty;
  if (type) filter.type = type;
  if (topic) filter.categories = topic;
  if (category) filter.categories = category;
  if (tag) filter.tags = new RegExp(`^${tag}$`, 'i');
  if (author) filter.author = author;
  if (skills) filter['placement.skills'] = { $in: [].concat(skills) };
  if (verified === 'true') filter.trustLevel = { $in: ['verified', 'official'] };
  return filter;
}

const SORTS = {
  newest: { publishedAt: -1, createdAt: -1 },
  popular: { likeCount: -1, views: -1 },
  trending: { views: -1, likeCount: -1, publishedAt: -1 },
  helpful: { bookmarkCount: -1, likeCount: -1 },
};

export async function listBlogs(query, { base = { status: BLOG_STATUS.PUBLISHED } } = {}) {
  const { page, limit, skip } = paginate(query);
  const filter = buildFilter(query, base);
  const sort = SORTS[query.sort] || SORTS.newest;

  const [items, total] = await Promise.all([
    Blog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar role')
      .populate('placement.company', 'name slug logo')
      .lean(),
    Blog.countDocuments(filter),
  ]);

  return { items: items.map(redactAnonymous), meta: pageMeta(page, limit, total) };
}

/* Hides author identity and sensitive fields per author choices. */
export function redactAnonymous(blog) {
  const b = { ...blog };
  if (b.isAnonymous) b.author = { name: 'Anonymous', avatar: '', anonymous: true };
  if (b.placement && !b.placement?.fieldVisibility?.ctc) {
    if (b.placement.ctc) b.placement = { ...b.placement, ctc: undefined };
  }
  return b;
}
