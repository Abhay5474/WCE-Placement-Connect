import { Notification } from '../models/interactions.js';
import { ok, asyncHandler } from '../utils/apiResponse.js';
import { paginate, pageMeta } from '../utils/pagination.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { recipient: req.user._id };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('actor', 'name avatar').lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);
  ok(res, items, 'OK', 200, { ...pageMeta(page, limit, total), unread });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, recipient: req.user._id }, { read: true });
  ok(res, null, 'Marked read');
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  ok(res, null, 'All notifications marked read');
});
