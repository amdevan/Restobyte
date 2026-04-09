import prisma from '../db/prisma.js';
import nodemailer from 'nodemailer';
import { welcomeTemplate, invoiceTemplate, resetPasswordTemplate } from './emailTemplates.js';

const getEnv = () => process.env.APP_ENV || process.env.NODE_ENV || 'dev';

export const getEmailConfig = async () => {
  const env = getEnv();
  const cfg = await prisma.saasEmailConfig.findUnique({ where: { env } });
  return cfg || null;
};

export const upsertEmailConfig = async (data: {
  provider?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  fromName?: string | null;
  fromEmail?: string | null;
}) => {
  const env = getEnv();
  return prisma.saasEmailConfig.upsert({
    where: { env },
    update: data,
    create: { env, ...data }
  });
};

const createTransporter = async () => {
  const cfg = await getEmailConfig();
  if (!cfg || cfg.provider !== 'smtp' || !cfg.smtpHost || !cfg.smtpUser) {
    throw new Error('Email not configured');
  }
  return nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort || 587,
    secure: !!cfg.smtpSecure,
    auth: { user: cfg.smtpUser, pass: cfg.smtpPass || '' }
  });
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  const cfg = await getEmailConfig();
  const transporter = await createTransporter();
  const from = `${cfg?.fromName || 'RestoByte'} <${cfg?.fromEmail || cfg?.smtpUser || 'no-reply@example.com'}>`;
  await transporter.sendMail({ from, to, subject, html });
};

export const sendWelcomeEmail = async (to: string, name?: string) => {
  await sendEmail(to, 'Welcome to RestoByte', welcomeTemplate(name || ''));
};

export const sendInvoiceEmail = async (to: string, params: { invoiceNumber: string; amount: string; currency: string }) => {
  await sendEmail(to, `Invoice ${params.invoiceNumber}`, invoiceTemplate(params));
};

export const sendResetPasswordEmail = async (to: string, link: string) => {
  await sendEmail(to, 'Reset your password', resetPasswordTemplate(link));
};
