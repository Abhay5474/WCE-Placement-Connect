import { User } from '../models/User.js';
import { Blog } from '../models/Blog.js';
import { Company } from '../models/Company.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { Report } from '../models/Report.js';
import { Comment } from '../models/interactions.js';
import { SearchHistory } from '../models/tracking.js';
import { ok, asyncHandler } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, pageMeta } from '../utils/pagination.js';
import { ALL_ROLES, REPORT_STATUS, BLOG_STATUS, ROLES, NOTIFICATION_TYPES } from '../config/constants.js';
import { notify } from '../services/notificationService.js';

/* ---- User management ---- */
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) filter.$or = [{ name: new RegExp(req.query.q, 'i') }, { email: new RegExp(req.query.q, 'i') }];
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  ok(res, items.map((u) => ({ ...u, passwordHash: undefined })), 'OK', 200, pageMeta(page, limit, total));
});

export const setRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!ALL_ROLES.includes(role)) throw ApiError.badRequest('Invalid role');
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  ok(res, { user: user.toPublicJSON() }, 'Role updated');
});

/* Contributor access management. */
export const listAccessRequests = asyncHandler(async (req, res) => {
  const users = await User.find({ 'accessRequest.status': 'pending' })
    .sort({ 'accessRequest.requestedAt': 1 })
    .lean();
  ok(res, users.map((u) => ({ ...u, passwordHash: undefined })));
});

export const setAccess = asyncHandler(async (req, res) => {
  const grant = !!req.body.grant;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  user.canContribute = grant;
  user.accessRequest = {
    ...(user.accessRequest || {}),
    status: grant ? 'approved' : 'rejected',
    decidedAt: new Date(),
    decidedBy: req.user._id,
  };
  await user.save();
  // Let the user know in real time.
  await notify({
    recipient: user._id,
    type: NOTIFICATION_TYPES.ADMIN_ANNOUNCEMENT,
    actor: req.user._id,
    message: grant
      ? 'Your contributor access was approved — you can now add placement experiences.'
      : 'Your contributor access request was declined.',
    link: '/create',
  }).catch(() => {});
  ok(res, { user: user.toPublicJSON() }, grant ? 'Access granted' : 'Access revoked');
});

export const setActive = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: !!req.body.isActive }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  ok(res, { user: user.toPublicJSON() }, 'User status updated');
});

/* ---- Moderation / reports ---- */
export const listReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('reporter', 'name').populate('blog', 'title slug').lean(),
    Report.countDocuments(filter),
  ]);
  ok(res, items, 'OK', 200, pageMeta(page, limit, total));
});

export const resolveReport = asyncHandler(async (req, res) => {
  const { status, resolution, action } = req.body;
  if (!Object.values(REPORT_STATUS).includes(status)) throw ApiError.badRequest('Invalid status');
  const report = await Report.findById(req.params.id);
  if (!report) throw ApiError.notFound('Report not found');

  // Optional moderation action (never automatic — a human decides here).
  if (action === 'archive_blog' && report.blog) {
    await Blog.updateOne({ _id: report.blog }, { status: BLOG_STATUS.ARCHIVED });
  } else if (action === 'delete_comment' && report.comment) {
    await Comment.updateOne({ _id: report.comment }, { isDeleted: true, content: '[removed]' });
  }

  report.status = status;
  report.resolution = resolution || '';
  report.moderator = req.user._id;
  await report.save();
  ok(res, { report }, 'Report updated');
});

/* ---- Platform analytics ---- */
export const analytics = asyncHandler(async (req, res) => {
  const pub = { status: BLOG_STATUS.PUBLISHED };
  const [
    totalUsers, totalBlogs, placementBlogs, totalCompanies, totalQuestions, openReports,
    byCompany, byYear, byBranch, topTopics, topSkills, searchTrends,
  ] = await Promise.all([
    User.countDocuments(),
    Blog.countDocuments(),
    Blog.countDocuments({ type: 'placement' }),
    Company.countDocuments(),
    InterviewQuestion.countDocuments(),
    Report.countDocuments({ status: REPORT_STATUS.OPEN }),
    Blog.aggregate([{ $match: { ...pub, 'placement.companyName': { $ne: '' } } },
      { $group: { _id: '$placement.companyName', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    Blog.aggregate([{ $match: { ...pub, 'placement.year': { $ne: null } } },
      { $group: { _id: '$placement.year', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Blog.aggregate([{ $match: { ...pub, 'placement.department': { $ne: '' } } },
      { $group: { _id: '$placement.department', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    InterviewQuestion.aggregate([{ $group: { _id: '$topic', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    Blog.aggregate([{ $unwind: '$placement.skills' }, { $group: { _id: '$placement.skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 }]),
    SearchHistory.aggregate([{ $group: { _id: '$query', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
  ]);

  ok(res, {
    totals: { totalUsers, totalBlogs, placementBlogs, totalCompanies, totalQuestions, openReports },
    charts: {
      blogsByCompany: byCompany.map((r) => ({ label: r._id, value: r.count })),
      blogsByYear: byYear.map((r) => ({ label: String(r._id), value: r.count })),
      contributionsByBranch: byBranch.map((r) => ({ label: r._id, value: r.count })),
      questionsByTopic: topTopics.map((r) => ({ label: r._id || 'General', value: r.count })),
      commonSkills: topSkills.map((r) => ({ label: r._id, value: r.count })),
      searchTrends: searchTrends.map((r) => ({ label: r._id, value: r.count })),
    },
  });
});

/* AI-assisted content queue — blogs whose cached moderation flagged issues. */
export const flaggedContent = asyncHandler(async (req, res) => {
  const { AIAnalysis } = await import('../models/AIAnalysis.js');
  const flagged = await AIAnalysis.find({ 'moderation.flagged': true })
    .populate('blog', 'title slug author status')
    .select('moderation blog').limit(50).lean();
  ok(res, flagged);
});
