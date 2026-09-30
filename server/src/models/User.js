import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ROLES, ALL_ROLES } from '../config/constants.js';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, default: ROLES.STUDENT, index: true },

    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },

    // Academic profile (used by recommendations)
    department: { type: String, default: '' },
    year: { type: Number, min: 1, max: 5 },
    graduationYear: { type: Number },
    skills: [{ type: String }],

    isEmailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },

    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // Refresh token rotation — store hashes of active tokens.
    refreshTokenHashes: { type: [String], select: false, default: [] },

    // Contributing (adding placement experiences) requires admin-granted access.
    // Reading is fully public and needs no account at all.
    canContribute: { type: Boolean, default: false },
    accessRequest: {
      status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
      message: { type: String, default: '' },
      requestedAt: { type: Date },
      decidedAt: { type: Date },
      decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },

    isActive: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false }, // clearly mark demo/seed accounts
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

/* Generates a raw token (returned to caller) and stores only its hash. */
function issueToken(field, expiresField, ttlMs) {
  return function generate() {
    const raw = crypto.randomBytes(32).toString('hex');
    this[field] = crypto.createHash('sha256').update(raw).digest('hex');
    this[expiresField] = new Date(Date.now() + ttlMs);
    return raw;
  };
}

userSchema.methods.createEmailVerifyToken = issueToken(
  'emailVerifyTokenHash',
  'emailVerifyExpires',
  24 * 60 * 60 * 1000
);
userSchema.methods.createPasswordResetToken = issueToken(
  'passwordResetTokenHash',
  'passwordResetExpires',
  60 * 60 * 1000
);

userSchema.statics.hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    bio: this.bio,
    department: this.department,
    year: this.year,
    graduationYear: this.graduationYear,
    skills: this.skills,
    isEmailVerified: this.isEmailVerified,
    isDemo: this.isDemo,
    // Elevated roles can always contribute; students need admin approval.
    canContribute: this.canContribute || ['faculty', 'coordinator', 'admin'].includes(this.role),
    accessRequestStatus: this.accessRequest?.status || 'none',
    createdAt: this.createdAt,
  };
};

export const User = model('User', userSchema);
export default User;
