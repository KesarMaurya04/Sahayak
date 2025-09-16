import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransport() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env as any;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    logger.warn('[email] SMTP not configured — falling back to console logs');
    transporter = null; // console fallback
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const t = getTransport();
  const from = process.env.SMTP_FROM || 'no-reply@example.com';
  if (!t) {
    logger.info({ to, subject }, '[email:console] ' + html.replace(/\s+/g, ' ').slice(0, 300));
    return;
  }
  await t.sendMail({ from, to, subject, html });
}

export async function sendPasswordResetEmail(to: string, name: string, link: string) {
  const html = `
    <p>Hi ${name || ''},</p>
    <p>We received a request to reset your Sahayak password.</p>
    <p><a href="${link}">Reset your password</a></p>
    <p>This link expires in 15 minutes. If you didn’t request it, you can safely ignore this email.</p>
  `;
  await sendEmail(to, 'Reset your Sahayak password', html);
}
