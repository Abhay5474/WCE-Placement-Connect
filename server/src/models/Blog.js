import mongoose from 'mongoose';
import {
  BLOG_STATUS,
  TRUST_LEVELS,
  CATEGORIES,
  PLACEMENT_TYPES,
  DIFFICULTY,
  RESULTS,
} from '../config/constants.js';

const { Schema, model } = mongoose;

/* Structured placement metadata embedded on the blog. Populated when the blog
   is of type "Placement Experience". Authors control visibility of sensitive
   fields (e.g. compensation) via fieldVisibility. */
const placementSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    companyName: { type: String, default: '' }, // denormalized for display/search
    role: { type: String, default: '' },
    // No strict enum here so legacy values (e.g. "On Campus") still save; the
    // allowed set for new/edited content is enforced by the request validator.
    placementType: { type: String },
    year: { type: Number },
    department: { type: String, default: '' },
    graduationYear: { type: Number },
    eligibility: { type: String, default: '' },
    ctc: { type: String, default: '' }, // optional, sensitive
    rounds: [{ name: String, description: String }],
    difficulty: { type: String, enum: DIFFICULTY },
    skills: [{ type: String }],
    technologies: [{ type: String }],
    preparationDuration: { type: String, default: '' },
    result: { type: String, enum: RESULTS },
    advice: { type: String, default: '' },
    fieldVisibility: {
      ctc: { type: Boolean, default: false }, // hidden by default
    },
  },
  { _id: false }
);

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    content: { type: String, required: true }, // sanitized rich text/markdown
    excerpt: { type: String, default: '' },
    coverImage: { type: String, default: '' },

    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isAnonymous: { type: Boolean, default: false }, // anonymous placement experiences

    status: { type: String, enum: Object.values(BLOG_STATUS), default: BLOG_STATUS.DRAFT, index: true },
    type: { type: String, default: 'general' }, // 'general' | 'placement'

    // Category: user-selected + AI-suggested (never blindly trusted).
    categories: [{ type: String, enum: CATEGORIES }],
    aiSuggestedCategories: [{ type: String }],
    tags: [{ type: String, index: true }],

    placement: { type: placementSchema, default: undefined },

    trustLevel: {
      type: String,
      enum: Object.values(TRUST_LEVELS),
      default: TRUST_LEVELS.STUDENT_SUBMITTED,
      index: true,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },

    // Engagement counters (denormalized for cheap reads).
    views: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    readingTimeMin: { type: Number, default: 1 },

    highlighted: { type: Boolean, default: false }, // coordinators can highlight
    isDemo: { type: Boolean, default: false },

    publishedAt: { type: Date },
  },
  { timestamps: true }
);

blogSchema.index({ title: 'text', content: 'text', tags: 'text', 'placement.companyName': 'text' });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ 'placement.company': 1, status: 1 });

export const Blog = model('Blog', blogSchema);
export default Blog;
