import mongoose from 'mongoose';
import { REPORT_STATUS } from '../config/constants.js';

const { Schema, model } = mongoose;

/* Reported content — AI moderation flags content for HUMAN review here rather
   than auto-deleting. */
const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User' }, // null if AI-flagged
    targetType: { type: String, enum: ['blog', 'comment'], required: true },
    blog: { type: Schema.Types.ObjectId, ref: 'Blog' },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    reason: { type: String, required: true },
    source: { type: String, enum: ['user', 'ai'], default: 'user' },
    aiFlags: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.OPEN,
      index: true,
    },
    moderator: { type: Schema.Types.ObjectId, ref: 'User' },
    resolution: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Report = model('Report', reportSchema);
export default Report;
