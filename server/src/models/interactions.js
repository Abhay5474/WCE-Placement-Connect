import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../config/constants.js';

const { Schema, model } = mongoose;

/* Comment (supports one level of replies via parent). */
const commentSchema = new Schema(
  {
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export const Comment = model('Comment', commentSchema);

/* Like/reaction — unique per (user, blog). */
const likeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
    reaction: { type: String, default: 'like' },
  },
  { timestamps: true }
);
likeSchema.index({ user: 1, blog: 1 }, { unique: true });
export const Like = model('Like', likeSchema);

/* Follow relationship. */
const followSchema = new Schema(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
followSchema.index({ follower: 1, following: 1 }, { unique: true });
export const Follow = model('Follow', followSchema);

/* Bookmark / Save for later. */
const bookmarkSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  },
  { timestamps: true }
);
bookmarkSchema.index({ user: 1, blog: 1 }, { unique: true });
export const Bookmark = model('Bookmark', bookmarkSchema);

/* Notification. */
const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    blog: { type: Schema.Types.ObjectId, ref: 'Blog' },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);
export const Notification = model('Notification', notificationSchema);
