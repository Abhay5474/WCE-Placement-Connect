import mongoose from 'mongoose';
import { DIFFICULTY } from '../config/constants.js';

const { Schema, model } = mongoose;

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    logo: { type: String, default: '' },
    description: { type: String, default: '' },
    industry: { type: String, default: '' },
    website: { type: String, default: '' },
    roles: [{ type: String }],
    requiredSkills: [{ type: String }],
    placementType: [{ type: String }],
    eligibility: { type: String, default: '' },
    difficulty: { type: String, enum: DIFFICULTY, default: 'Medium' },
    averagePreparationTime: { type: String, default: '' },
    // Information verified by a placement coordinator/admin.
    verifiedInformation: { type: Boolean, default: false },
    // AI preparation summary is generated lazily and cached here.
    aiPreparationSummary: { type: String, default: '' },
    aiSummaryUpdatedAt: { type: Date },
    isDemo: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

companySchema.index({ name: 'text', description: 'text', industry: 'text' });

export const Company = model('Company', companySchema);
export default Company;
