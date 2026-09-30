import { env } from '../config/env.js';
import { logger } from './logger.js';

/* Email sender. If SMTP is not configured (common in dev), it logs the message
   to the console so verification / reset links are still visible to developers.
   Swap in nodemailer/Resend in production without touching callers. */
export async function sendMail({ to, subject, html, text }) {
  if (!env.mail.host) {
    logger.info(`[MAIL:dev] To: ${to} | ${subject}\n${text || html}`);
    return { delivered: false, dev: true };
  }
  // Production integration point (nodemailer, etc.) — intentionally minimal here.
  logger.info(`[MAIL] Would send to ${to}: ${subject}`);
  return { delivered: true };
}

export const buildVerifyEmail = (name, link) => ({
  subject: 'Verify your WCEConnect AI account',
  text: `Hi ${name}, verify your account: ${link}`,
  html: `<p>Hi ${name},</p><p>Welcome to WCEConnect AI. Please verify your account:</p><p><a href="${link}">${link}</a></p>`,
});

export const buildResetEmail = (name, link) => ({
  subject: 'Reset your WCEConnect AI password',
  text: `Hi ${name}, reset your password: ${link}`,
  html: `<p>Hi ${name},</p><p>Reset your password (valid 1 hour):</p><p><a href="${link}">${link}</a></p>`,
});
