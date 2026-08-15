import { Company } from '../models/Company.js';
import { Blog } from '../models/Blog.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { ok, created, asyncHandler } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slug.js';
import { redactAnonymous } from '../services/blogQueryService.js';
import { chat } from '../services/ai/providers/index.js';
import { paginate, pageMeta } from '../utils/pagination.js';
import { BLOG_STATUS } from '../config/constants.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = req.query.q ? { $text: { $search: req.query.q } } : {};
  const [items, total] = await Promise.all([
    Company.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Company.countDocuments(filter),
  ]);
  // Attach experience counts.
  const withCounts = await Promise.all(
    items.map(async (c) => ({
      ...c,
      experienceCount: await Blog.countDocuments({ 'placement.company': c._id, status: BLOG_STATUS.PUBLISHED }),
    }))
  );
  ok(res, withCounts, 'OK', 200, pageMeta(page, limit, total));
});

export const getBySlug = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ slug: req.params.slug }).lean();
  if (!company) throw ApiError.notFound('Company not found');

  const [experiences, questions] = await Promise.all([
    Blog.find({ 'placement.company': company._id, status: BLOG_STATUS.PUBLISHED })
      .sort({ publishedAt: -1 })
      .limit(20)
      .populate('author', 'name avatar')
      .lean(),
    InterviewQuestion.find({ company: company._id }).sort({ frequency: -1 }).limit(30).lean(),
  ]);

  ok(res, {
    company,
    experiences: experiences.map(redactAnonymous),
    interviewQuestions: questions,
    stats: { experienceCount: experiences.length, questionCount: questions.length },
  });
});

/* Company comparison — "Based on available student reports." */
export const compare = asyncHandler(async (req, res) => {
  const slugs = String(req.query.slugs || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (slugs.length < 2) throw ApiError.badRequest('Provide at least two company slugs');
  const companies = await Company.find({ slug: { $in: slugs } }).lean();
  const data = await Promise.all(
    companies.map(async (c) => {
      const experienceCount = await Blog.countDocuments({ 'placement.company': c._id, status: BLOG_STATUS.PUBLISHED });
      const questionCount = await InterviewQuestion.countDocuments({ company: c._id });
      return {
        name: c.name, slug: c.slug, roles: c.roles, requiredSkills: c.requiredSkills,
        difficulty: c.difficulty, averagePreparationTime: c.averagePreparationTime,
        experienceCount, questionCount,
      };
    })
  );
  ok(res, { companies: data, disclaimer: 'Based on available student reports.' });
});

/* AI preparation summary for a company — cached, grounded in stored experiences. */
export const prepSummary = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ slug: req.params.slug });
  if (!company) throw ApiError.notFound('Company not found');

  const stale = !company.aiSummaryUpdatedAt || Date.now() - company.aiSummaryUpdatedAt > 7 * 864e5;
  if (company.aiPreparationSummary && !stale) {
    return ok(res, { summary: company.aiPreparationSummary, aiGenerated: true, cached: true });
  }

  const blogs = await Blog.find({ 'placement.company': company._id, status: BLOG_STATUS.PUBLISHED })
    .limit(10).select('title excerpt placement').lean();
  const context = blogs.map((b) => `${b.title}: ${b.excerpt}`).join('\n');
  const { text } = await chat({
    system: 'Summarize how students prepared for this company, grounded only in the provided experiences. Do not invent facts.',
    prompt: `Company: ${company.name}. Summarize preparation strategy, common topics and rounds.`,
    context,
  });
  company.aiPreparationSummary = text;
  company.aiSummaryUpdatedAt = new Date();
  await company.save();
  ok(res, { summary: text, aiGenerated: true, cached: false, basedOn: blogs.length });
});

/* Create / update (coordinator/admin). */
export const create = asyncHandler(async (req, res) => {
  const company = await Company.create({ ...req.body, slug: uniqueSlug(req.body.name), createdBy: req.user._id });
  created(res, { company }, 'Company created');
});

export const update = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) throw ApiError.notFound('Company not found');
  ok(res, { company }, 'Company updated');
});

export const remove = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) throw ApiError.notFound('Company not found');
  ok(res, null, 'Company deleted');
});
