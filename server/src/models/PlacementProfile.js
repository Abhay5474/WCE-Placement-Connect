import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/* A student's placement preparation profile — powers the dashboard and
   personalized recommendations. One per user. */
const placementProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    branch: { type: String, default: '' },
    year: { type: Number },
    skills: [{ type: String }],
    targetRoles: [{ type: String }],
    targetCompanies: [{ type: Schema.Types.ObjectId, ref: 'Company' }],
    preparationProgress: [
      {
        topic: String,
        completed: { type: Number, default: 0 }, // 0-100
      },
    ],
    savedResources: [{ label: String, url: String }],
  },
  { timestamps: true }
);

export const PlacementProfile = model('PlacementProfile', placementProfileSchema);
export default PlacementProfile;
