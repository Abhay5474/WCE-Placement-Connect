import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { sendMail, buildVerifyEmail, buildResetEmail } from '../utils/mailer.js';
import { logger } from '../utils/logger.js';

const MAX_REFRESH_TOKENS = 5;

function assertCollegeEmail(email) {
  // Domain restriction is OFF by default — anyone can register to read/contribute.
  // Enable it only if RESTRICT_EMAIL_DOMAIN=true is set in the environment.
  if (!env.restrictEmailDomain) return;
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain !== env.collegeEmailDomain) {
    throw ApiError.badRequest(
      `Registration is restricted to @${env.collegeEmailDomain} email addresses`
    );
  }
}

async function issueSession(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const hash = User.hashToken(refreshToken);
  user.refreshTokenHashes = [...(user.refreshTokenHashes || []), hash].slice(-MAX_REFRESH_TOKENS);
  user.lastLoginAt = new Date();
  await user.save();
  return { accessToken, refreshToken };
}

export async function register({ name, email, password, department, year, graduationYear }) {
  assertCollegeEmail(email);
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  const user = new User({ name, email, department, year, graduationYear });
  await user.setPassword(password);
  const rawVerify = user.createEmailVerifyToken();
  await user.save();

  const link = `${env.clientUrl}/verify-email?token=${rawVerify}&email=${encodeURIComponent(email)}`;
  await sendMail({ to: email, ...buildVerifyEmail(name, link) });

  // If verification is not required, log the user in immediately.
  const session = env.requireEmailVerification ? null : await issueSession(user);
  return { user: user.toPublicJSON(), ...(session || {}), verifyLinkDev: env.isProd ? undefined : link };
}

export async function verifyEmail({ email, token }) {
  const user = await User.findOne({ email }).select('+emailVerifyTokenHash +emailVerifyExpires');
  if (!user) throw ApiError.notFound('User not found');
  const hash = User.hashToken(token);
  if (user.emailVerifyTokenHash !== hash || user.emailVerifyExpires < new Date()) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }
  user.isEmailVerified = true;
  user.emailVerifyTokenHash = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();
  return { user: user.toPublicJSON() };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokenHashes');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Account disabled');
  if (env.requireEmailVerification && !user.isEmailVerified) {
    throw ApiError.forbidden('Please verify your email before logging in');
  }
  const session = await issueSession(user);
  return { user: user.toPublicJSON(), ...session };
}

export async function refresh({ refreshToken }) {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token required');
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub).select('+refreshTokenHashes');
  if (!user) throw ApiError.unauthorized('Invalid session');

  const hash = User.hashToken(refreshToken);
  if (!(user.refreshTokenHashes || []).includes(hash)) {
    throw ApiError.unauthorized('Refresh token no longer valid');
  }
  // Rotate: drop the used token, issue a fresh pair.
  user.refreshTokenHashes = user.refreshTokenHashes.filter((h) => h !== hash);
  const session = await issueSession(user);
  return { user: user.toPublicJSON(), ...session };
}

export async function logout({ userId, refreshToken }) {
  const user = await User.findById(userId).select('+refreshTokenHashes');
  if (user && refreshToken) {
    const hash = User.hashToken(refreshToken);
    user.refreshTokenHashes = (user.refreshTokenHashes || []).filter((h) => h !== hash);
    await user.save();
  }
  return { success: true };
}

export async function forgotPassword({ email }) {
  const user = await User.findOne({ email });
  // Do not reveal whether the account exists.
  if (user) {
    const raw = user.createPasswordResetToken();
    await user.save();
    const link = `${env.clientUrl}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;
    await sendMail({ to: email, ...buildResetEmail(user.name, link) });
    if (!env.isProd) logger.info(`[dev] Password reset link: ${link}`);
  }
  return { message: 'If an account exists, a reset link has been sent.' };
}

export async function resetPassword({ email, token, password }) {
  const user = await User.findOne({ email }).select(
    '+passwordResetTokenHash +passwordResetExpires +refreshTokenHashes'
  );
  if (!user) throw ApiError.notFound('User not found');
  const hash = User.hashToken(token);
  if (user.passwordResetTokenHash !== hash || user.passwordResetExpires < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }
  await user.setPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenHashes = []; // invalidate all sessions
  await user.save();
  return { message: 'Password reset successful. Please log in.' };
}

export async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash +refreshTokenHashes');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  await user.setPassword(newPassword);
  user.refreshTokenHashes = [];
  await user.save();
  return { message: 'Password changed. Please log in again.' };
}
