import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { ok, asyncHandler } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, pageMeta } from '../utils/pagination.js';
import { ROLES } from '../config/constants.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { company, topic, difficulty, role, round, q } = req.query;
  const filter = {};
  if (company) filter.companyName = new RegExp(company, 'i');
  if (topic) filter.topic = new RegExp(`^${topic}$`, 'i');
  if (difficulty) filter.difficulty = difficulty;
  if (role) filter.role = new RegExp(role, 'i');
  if (round) filter.round = new RegExp(round, 'i');
  if (q) filter.$text = { $search: q };

  const [items, total] = await Promise.all([
    InterviewQuestion.find(filter)
      .sort({ frequency: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('company', 'name slug logo')
      .lean(),
    InterviewQuestion.countDocuments(filter),
  ]);
  ok(res, items, 'OK', 200, pageMeta(page, limit, total));
});

/* Frequently asked — grouped by company + topic, counts from stored data only. */
export const frequent = asyncHandler(async (req, res) => {
  const rows = await InterviewQuestion.aggregate([
    { $group: { _id: { company: '$companyName', topic: '$topic', difficulty: '$difficulty' },
      totalFrequency: { $sum: '$frequency' }, count: { $sum: 1 } } },
    { $sort: { totalFrequency: -1 } },
    { $limit: 20 },
  ]);
  ok(res, rows.map((r) => ({ ...r._id, ...r, _id: undefined })));
});

export const verify = asyncHandler(async (req, res) => {
  if (![ROLES.COORDINATOR, ROLES.ADMIN, ROLES.FACULTY].includes(req.user.role)) {
    throw ApiError.forbidden();
  }
  const q = await InterviewQuestion.findByIdAndUpdate(
    req.params.id,
    { verified: !!req.body.verified },
    { new: true }
  );
  if (!q) throw ApiError.notFound('Question not found');
  ok(res, { question: q }, 'Question verification updated');
});
