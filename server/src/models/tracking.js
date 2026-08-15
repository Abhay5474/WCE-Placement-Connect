import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/* Records a user viewing a blog — feeds recommendations and "recently viewed". */
const readingHistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
readingHistorySchema.index({ user: 1, viewedAt: -1 });
export const ReadingHistory = model('ReadingHistory', readingHistorySchema);

/* Search query log — feeds trending/search analytics. */
const searchHistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    query: { type: String, required: true },
    mode: { type: String, default: 'keyword' }, // keyword | semantic
    resultCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
searchHistorySchema.index({ createdAt: -1 });
export const SearchHistory = model('SearchHistory', searchHistorySchema);
