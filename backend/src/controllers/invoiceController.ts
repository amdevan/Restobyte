import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const generateInvoiceNumber = async (outletId: string) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}`;
  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
  });
  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
    nextNumber = lastNumber + 1;
  }
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
};

const getAccessibleOutletIds = async (user: NonNullable<AuthRequest['user']>) => {
  if (user.isSuperAdmin) return null;
  if (user.roleId === 'role-admin') {
    if (!user.tenantId) return [];
    const outlets = await prisma.outlet.findMany({ where: { tenantId: user.tenantId }, select: { id: true } });
    return outlets.map((outlet) => outlet.id);
  }
  return Array.isArray((user as any).outletIds && (user as any).outletIds.length > 0
    ? (user as any).outletIds.map(String)
    : (user.outletId ? [String(user.outletId)] : []);
};

const canAccessOutlet = async (user: NonNullable<AuthRequest['user']>, outletId?: string | null) => {
  if (!outletId) return false;
  const allowedOutletIds = await getAccessibleOutletIds(user);
  return allowedOutletIds === null || allowedOutletIds.includes(String(outletId));
};

export const getInvoices = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId : undefined;
  const requestedOutletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (!(await canAccessOutlet(user, requestedOutletId))) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const invoices = await prisma.invoice.findMany({
    where: { outletId: requestedOutletId },
    include: { order: true, customer: true, paymentHistories: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(invoices);
};

export const getInvoice = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const allowedOutletIds = await getAccessibleOutletIds(user);
  const invoice = await prisma.invoice.findFirst({
    where: { id, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } : {}) },
    include: { order: true, customer: true, paymentHistories: true, outlet: true },
  });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
};

export const getPublicInvoice = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const invoice = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }],
    include: { 
      order: { include: { items: { include: { menuItem: true } } },
      customer: true,
      paymentHistories: true,
      outlet: true,
    },
  });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
};

export const createInvoice = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const { orderId, customerId, outletId, totalAmount, taxAmount, discountAmount, paidAmount, paymentMethod, items } = req.body;
  const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId : undefined;
  const requestedOutletId = (typeof outletId === 'string' ? outletId : undefined) || queryOutletId || (user.outletId ? String(user.outletId) : undefined);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (!(await canAccessOutlet(user, requestedOutletId))) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId });
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  const invoiceNumber = await generateInvoiceNumber(requestedOutletId);
  const total = totalAmount || order.total;
  const paid = paidAmount || 0;
  const due = Math.max(0, total - paid);
  let paymentStatus = 'DUE';
  if (due === 0) {
    paymentStatus = 'PAID';
  } else if (paid > 0) {
    paymentStatus = 'PARTIAL';
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId,
      customerId,
      outletId: requestedOutletId,
      totalAmount: total,
      taxAmount: taxAmount || 0,
      discountAmount: discountAmount || 0,
      paidAmount: paid,
      dueAmount: due,
      paymentStatus,
      paymentMethod,
      items,
      paidAt: paymentStatus === 'PAID' ? new Date() : null,
    },
    include: { order: true, customer: true },
  });

  if (paid > 0) {
    await prisma.paymentHistory.create({
      data: {
        invoiceId: invoice.id,
        customerId,
        amount: paid,
        method: paymentMethod || 'CASH',
      },
    });
    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (customer) {
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            totalPurchaseAmount: customer.totalPurchaseAmount + total,
            totalPaidAmount: customer.totalPaidAmount + paid,
            dueAmount: Math.max(0, customer.dueAmount + due),
            lastPaymentDate: new Date(),
          },
        });
      }
    }
  } else if (customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (customer) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          totalPurchaseAmount: customer.totalPurchaseAmount + total,
          dueAmount: customer.dueAmount + due,
        },
      });
    }
  }

  res.status(201).json(invoice);
};

export const updateInvoice = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Invoice not found' });
    return;
  }
  if (!(await canAccessOutlet(user, existing.outletId))) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const { totalAmount, taxAmount, discountAmount } = req.body;
  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(totalAmount !== undefined ? { totalAmount: Number(totalAmount) } : {}),
      ...(taxAmount !== undefined ? { taxAmount: Number(taxAmount) } : {}),
      ...(discountAmount !== undefined ? { discountAmount: Number(discountAmount) } : {}),
    },
    include: { order: true, customer: true, paymentHistories: true },
  });

  res.json(invoice);
};

export const addPayment = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    res.status(404).json({ message: 'Invoice not found' });
    return;
  }
  if (!(await canAccessOutlet(user, invoice.outletId))) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const { amount, method } = req.body;
  const paymentAmount = Number(amount);
  if (paymentAmount <= 0) {
    res.status(400).json({ message: 'Payment amount must be greater than zero' });
    return;
  }

  const newPaidAmount = invoice.paidAmount + paymentAmount;
  const newDueAmount = Math.max(0, invoice.totalAmount - newPaidAmount);
  let newPaymentStatus = 'PAID';
  if (newDueAmount > 0) {
    newPaymentStatus = 'PARTIAL';
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      paymentStatus: newPaymentStatus,
      paidAt: newPaymentStatus === 'PAID' ? new Date() : invoice.paidAt,
    },
    include: { order: true, customer: true, paymentHistories: true },
  });

  await prisma.paymentHistory.create({
    data: {
      invoiceId: id,
      customerId: invoice.customerId,
      amount: paymentAmount,
      method: method || 'CASH',
    },
  });

  if (invoice.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: invoice.customerId } });
    if (customer) {
      await prisma.customer.update({
        where: { id: invoice.customerId },
        data: {
          totalPaidAmount: customer.totalPaidAmount + paymentAmount,
          dueAmount: Math.max(0, customer.dueAmount - paymentAmount),
          lastPaymentDate: new Date(),
        },
      });
    }
  }

  res.json(updatedInvoice);
};
