import mongoose from 'mongoose';
import { DIFFICULTY } from '../config/constants.js';

const { Schema, model } = mongoose;

const interviewQuestionSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    normalized: { type: String, index: true }, // lowercased, for de-duplication
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    companyName: { type: String, default: '' },
    role: { type: String, default: '' },
    topic: { type: String, default: '' }, // DSA, System Design, HR, ...
    difficulty: { type: String, enum: DIFFICULTY, default: 'Medium' },
    round: { type: String, default: '' },
    // First blog it was extracted from; frequency counts distinct source blogs.
    sourceBlog: { type: Schema.Types.ObjectId, ref: 'Blog' },
    sourceBlogs: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],
    frequency: { type: Number, default: 1 }, // computed from stored data only
    verified: { type: Boolean, default: false },
    extractedByAI: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interviewQuestionSchema.index({ companyName: 1, topic: 1 });
interviewQuestionSchema.index({ question: 'text' });

export const InterviewQuestion = model('InterviewQuestion', interviewQuestionSchema);
export default InterviewQuestion;
