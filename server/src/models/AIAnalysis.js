import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/* Cached AI analysis for a blog. Regenerated only when the content hash changes,
   keeping AI cost under control. Includes the embedding used for semantic search
   (local vector backend); Atlas backend stores the same vector on the blog index. */
const aiAnalysisSchema = new Schema(
  {
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true, unique: true, index: true },
    contentHash: { type: String, required: true },

    summary: { type: String, default: '' },
    quickSummary: { type: Schema.Types.Mixed }, // structured: company, role, rounds...
    suggestedTags: [{ type: String }],
    suggestedTitles: [{ type: String }],
    suggestedCategories: [{ type: String }],

    qualityScore: {
      readability: Number,
      completeness: Number,
      grammar: Number,
      structure: Number,
      relevance: Number,
      overall: Number,
    },
    tone: { type: Schema.Types.Mixed },
    keywords: [{ type: String }],

    moderation: { type: Schema.Types.Mixed }, // flags, not auto-actions

    embedding: { type: [Number], default: undefined }, // vector for semantic search
    embeddingModel: { type: String, default: '' },

    provider: { type: String, default: '' },
  },
  { timestamps: true }
);

export const AIAnalysis = model('AIAnalysis', aiAnalysisSchema);
export default AIAnalysis;
