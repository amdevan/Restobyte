import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { sendInvoiceEmail } from '../services/emailService.js';

export const createPayment = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  if (!auth.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  const { tenantId, amount, method, notes, emailTo } = req.body || {};
  if (!tenantId || amount === undefined) {
    res.status(400).json({ message: 'tenantId and amount are required' });
    return;
  }
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: String(tenantId) } });
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }
    const payment = await (prisma as any).payment.create({
      data: {
        tenantId: tenant.id,
        amount: Number(amount),
        method: method || 'manual',
        notes: notes || null,
        status: 'paid'
      }
    });
    if (emailTo) {
      const invoiceNumber = `PMT-${payment.id.slice(0, 8).toUpperCase()}`;
      const currency = (tenant as any).currencyCode || 'USD';
      const amountStr = Number(amount).toFixed(2);
      try {
        await sendInvoiceEmail(String(emailTo), { invoiceNumber, amount: amountStr, currency });
      } catch {}
    }
    res.status(201).json({ payment });
  } catch (e) {
    console.error('createPayment error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
