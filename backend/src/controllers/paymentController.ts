import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { sendInvoiceEmail } from '../services/emailService.js';
import { createInvoiceForPayment } from '../services/invoiceService.js';

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
    const result = await prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.create({
        data: {
          tenantId: tenant.id,
          amount: Number(amount),
          method: method || 'manual',
          notes: notes || null,
          status: 'paid'
        }
      });
      const invoice = await createInvoiceForPayment(tx, {
        tenantId: tenant.id,
        paymentId: payment.id,
        amount: Number(amount),
        currencyCode: (tenant as any).currencyCode || 'NPR',
        status: 'paid',
        method: method || 'manual',
        notes: notes || null,
        issuedAt: payment.createdAt,
        paidAt: payment.createdAt,
      });
      return { payment, invoice };
    });
    if (emailTo) {
      const invoiceNumber = result.invoice.invoiceNumber;
      const currency = (tenant as any).currencyCode || 'NPR';
      const amountStr = Number(amount).toFixed(2);
      try {
        await sendInvoiceEmail(String(emailTo), { invoiceNumber, amount: amountStr, currency });
      } catch {}
    }
    res.status(201).json(result);
  } catch (e) {
    console.error('createPayment error:', e);
    res.status(500).json({ message: 'Server error' });
  }
};
