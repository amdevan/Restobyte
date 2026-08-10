import { Request, Response } from 'express';
import prisma, { withRetry } from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

// Helper to validate outlet access
async function validateOutletAccess(user: any, outletId: string): Promise<boolean> {
  if (user.isSuperAdmin) return true;
  if (user.roleId === 'role-admin') {
    if (!user.tenantId) return false;
    const outlet = await prisma.outlet.findFirst({ where: { id: outletId, tenantId: user.tenantId } });
    return !!outlet;
  }
  const allowedOutletIds = Array.isArray(user.outletIds) && user.outletIds.length > 0
    ? user.outletIds.map(String)
    : (user.outletId ? [String(user.outletId)] : []);
  return allowedOutletIds.includes(outletId);
}

// ==================== Expenses ====================

export const getExpenses = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = req.query.outletId as string;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const expenses = await withRetry(() => prisma.expense.findMany({
    where: { outletId },
    orderBy: { date: 'desc' },
  }));
  res.json(expenses);
};

export const createExpense = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, date, categoryId, categoryName, amount, payee, description, paymentMethod, referenceNumber } = req.body;
  if (!outletId || !categoryId || !categoryName || amount === undefined || !paymentMethod) {
    res.status(400).json({ message: 'outletId, categoryId, categoryName, amount, and paymentMethod are required' });
    return;
  }
  if (!await validateOutletAccess(user, outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const expense = await withRetry(() => prisma.expense.create({
    data: {
      outletId,
      date: date ? new Date(date) : new Date(),
      categoryId,
      categoryName,
      amount: Number(amount),
      payee: payee || null,
      description: description || null,
      paymentMethod,
      referenceNumber: referenceNumber || null,
    },
  }));
  res.status(201).json(expense);
};

export const updateExpense = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Expense not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { date, categoryId, categoryName, amount, payee, description, paymentMethod, referenceNumber } = req.body;
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(date !== undefined ? { date: new Date(date) } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(categoryName !== undefined ? { categoryName } : {}),
      ...(amount !== undefined ? { amount: Number(amount) } : {}),
      ...(payee !== undefined ? { payee: payee || null } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(paymentMethod !== undefined ? { paymentMethod } : {}),
      ...(referenceNumber !== undefined ? { referenceNumber: referenceNumber || null } : {}),
    },
  });
  res.json(expense);
};

export const deleteExpense = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Expense not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  await prisma.expense.delete({ where: { id } });
  res.status(204).send();
};

// ==================== Expense Categories ====================

export const getExpenseCategories = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = req.query.outletId as string;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const categories = await prisma.expenseCategory.findMany({
    where: { outletId },
    orderBy: { name: 'asc' },
  });
  res.json(categories);
};

export const createExpenseCategory = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, name } = req.body;
  if (!outletId || !name) { res.status(400).json({ message: 'outletId and name are required' }); return; }
  if (!await validateOutletAccess(user, outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const category = await prisma.expenseCategory.create({
    data: {
      outletId,
      name,
    },
  });
  res.status(201).json(category);
};

export const deleteExpenseCategory = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.expenseCategory.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Expense category not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  await prisma.expenseCategory.delete({ where: { id } });
  res.status(204).send();
};
