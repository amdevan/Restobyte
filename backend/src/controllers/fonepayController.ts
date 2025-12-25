import type { Request, Response } from 'express';

// Simple in-memory store for QR sessions (prototype only)
type SessionStatus = 'pending' | 'paid' | 'failed' | 'expired';
type FonepaySession = {
  id: string;
  amount: number;
  currency: string;
  merchantCode: string;
  terminalId: string;
  status: SessionStatus;
  createdAt: number;
  expiresAt: number; // epoch ms
  qrUrl: string;
};

const sessions = new Map<string, FonepaySession>();

const QR_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export const createQR = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'NPR', merchantCode, terminalId } = req.body || {};

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (!merchantCode || !terminalId) {
      return res.status(400).json({ error: 'Missing merchantCode or terminalId' });
    }

    // Build a placeholder payload (replace with EMVCo-compliant payload and signing server-side)
    const payloadObj = {
      type: 'FONEPAY_DYNAMIC_QR',
      merchantCode,
      terminalId,
      currency,
      amount: numAmount.toFixed(2),
      ts: Date.now(),
    };
    const payload = encodeURIComponent(JSON.stringify(payloadObj));
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=320x320&chl=${payload}`;

    const id = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const session: FonepaySession = {
      id,
      amount: numAmount,
      currency,
      merchantCode,
      terminalId,
      status: 'pending',
      createdAt: now,
      expiresAt: now + QR_EXPIRY_MS,
      qrUrl,
    };
    sessions.set(id, session);

    return res.status(201).json({ qrSessionId: id, qrUrl, status: 'pending', expiresAt: session.expiresAt });
  } catch (err: any) {
    console.error('Error creating Fonepay QR:', err);
    return res.status(500).json({ error: 'Failed to create QR' });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  const qrSessionId = (req.query.qrSessionId as string) || '';
  if (!qrSessionId) return res.status(400).json({ error: 'qrSessionId is required' });
  const session = sessions.get(qrSessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const now = Date.now();
  if (session.status === 'pending' && now > session.expiresAt) {
    session.status = 'expired';
    sessions.set(qrSessionId, session);
  }
  return res.json({ qrSessionId, status: session.status, expiresAt: session.expiresAt });
};

// Prototype-only helper to simulate marking a session as paid (use webhook in production)
export const markPaid = async (req: Request, res: Response) => {
  const { qrSessionId } = req.body || {};
  if (!qrSessionId) return res.status(400).json({ error: 'qrSessionId is required' });
  const session = sessions.get(qrSessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.status = 'paid';
  sessions.set(qrSessionId, session);
  return res.json({ ok: true });
};

