import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { getEmailConfig, upsertEmailConfig, sendWelcomeEmail, sendInvoiceEmail, sendResetPasswordEmail } from '../services/emailService.js';

export const sendTestEmail = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  if (!auth.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  const { to, smtp } = req.body as {
    to: string;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
      fromName?: string;
      fromEmail?: string;
    };
  };
  if (!to || !smtp?.host || !smtp?.user) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }
  try {
    await upsertEmailConfig({
      provider: 'smtp',
      smtpHost: smtp.host,
      smtpPort: smtp.port,
      smtpSecure: smtp.secure,
      smtpUser: smtp.user,
      smtpPass: smtp.pass,
      fromName: smtp.fromName || null,
      fromEmail: smtp.fromEmail || null
    });
    await sendWelcomeEmail(to, 'there');
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'Failed to send' });
  }
};

export const getEmailSettings = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  if (!auth.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  const cfg = await getEmailConfig();
  res.json(cfg);
};

export const updateEmailSettings = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  if (!auth.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  const cfg = await upsertEmailConfig(req.body || {});
  res.json(cfg);
};

export const sendTemplateEmail = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  if (!auth.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  const { type, to, params } = req.body as any;
  try {
    if (type === 'welcome') {
      await sendWelcomeEmail(to, params?.name);
    } else if (type === 'invoice') {
      await sendInvoiceEmail(to, params);
    } else if (type === 'reset') {
      await sendResetPasswordEmail(to, params?.link);
    } else {
      res.status(400).json({ message: 'Unknown email type' });
      return;
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'Failed to send' });
  }
};
