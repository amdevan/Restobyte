import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
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

// ==================== Purchases ====================

export const getPurchases = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = req.query.outletId as string;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const purchases = await prisma.purchase.findMany({
    where: { outletId: String(outletId) },
    include: { items: true, payments: true },
    orderBy: { date: 'desc' },
  });
  res.json(purchases);
};

export const getPurchaseById = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true, payments: true },
  });
  if (!purchase) { res.status(404).json({ message: 'Purchase not found' }); return; }
  if (!await validateOutletAccess(user, purchase.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  res.json(purchase);
};

export const createPurchase = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, date, supplierId, supplierName, supplierInvoiceNumber, items, subTotalAmount, taxAmount, discountAmount, grandTotalAmount, paidAmount, notes } = req.body;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!Array.isArray(items) || items.length === 0) { res.status(400).json({ message: 'items array is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const purchaseNumber = `PUR-${Date.now()}`;

  const purchase = await prisma.$transaction(async (tx) => {
    const newPurchase = await tx.purchase.create({
      data: {
        outletId: String(outletId),
        purchaseNumber,
        date: date ? new Date(date) : new Date(),
        supplierId: supplierId || null,
        supplierName: supplierName || null,
        supplierInvoiceNumber: supplierInvoiceNumber || null,
        subTotalAmount: Number(subTotalAmount) || 0,
        taxAmount: Number(taxAmount) || 0,
        discountAmount: Number(discountAmount) || 0,
        grandTotalAmount: Number(grandTotalAmount) || 0,
        paidAmount: Number(paidAmount) || 0,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            stockItemId: item.stockItemId || null,
            itemName: item.itemName,
            category: item.category || '',
            unit: item.unit || 'pcs',
            lowStockThreshold: Number(item.lowStockThreshold) || 0,
            quantityPurchased: Number(item.quantityPurchased),
            costPerUnit: Number(item.costPerUnit),
            subTotal: Number(item.subTotal),
          })),
        },
      },
      include: { items: true, payments: true },
    });

    if (Number(paidAmount) > 0) {
      await tx.supplierPayment.create({
        data: {
          purchaseId: newPurchase.id,
          amountPaid: Number(paidAmount),
          paymentDate: date ? new Date(date) : new Date(),
          paymentMethod: 'initial',
          notes: 'Initial payment',
        },
      });
    }

    // Update stock quantities for items linked to existing stock items
    for (const item of items) {
      if (item.stockItemId) {
        try {
          await tx.stockItem.update({
            where: { id: item.stockItemId },
            data: {
              quantity: { increment: Number(item.quantityPurchased) },
              ...(item.costPerUnit ? { costPerUnit: Number(item.costPerUnit) } : {}),
            },
          });
        } catch (err) {
          // Stock item might not exist anymore, skip silently
        }
      } else {
        // Find or create stock item by name
        const existingItem = await tx.stockItem.findFirst({
          where: {
            name: { equals: item.itemName, mode: 'insensitive' },
          },
        });
        if (existingItem) {
          await tx.stockItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: { increment: Number(item.quantityPurchased) },
              ...(item.costPerUnit ? { costPerUnit: Number(item.costPerUnit) } : {}),
            },
          });
        } else {
          await tx.stockItem.create({
            data: {
              outletId: String(outletId),
              name: item.itemName,
              category: item.category || 'Uncategorized',
              unit: item.unit || 'pcs',
              quantity: Number(item.quantityPurchased),
              costPerUnit: Number(item.costPerUnit) || 0,
              lowStockThreshold: Number(item.lowStockThreshold) || 0,
            },
          });
        }
      }
    }

    return newPurchase;
  });

  res.status(201).json(purchase);
};

export const updatePurchase = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Purchase not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { date, supplierId, supplierName, supplierInvoiceNumber, subTotalAmount, taxAmount, discountAmount, grandTotalAmount, paidAmount, notes } = req.body;
  const purchase = await prisma.purchase.update({
    where: { id },
    data: {
      ...(date !== undefined ? { date: new Date(date) } : {}),
      ...(supplierId !== undefined ? { supplierId: supplierId || null } : {}),
      ...(supplierName !== undefined ? { supplierName: supplierName || null } : {}),
      ...(supplierInvoiceNumber !== undefined ? { supplierInvoiceNumber: supplierInvoiceNumber || null } : {}),
      ...(subTotalAmount !== undefined ? { subTotalAmount: Number(subTotalAmount) } : {}),
      ...(taxAmount !== undefined ? { taxAmount: Number(taxAmount) } : {}),
      ...(discountAmount !== undefined ? { discountAmount: Number(discountAmount) } : {}),
      ...(grandTotalAmount !== undefined ? { grandTotalAmount: Number(grandTotalAmount) } : {}),
      ...(paidAmount !== undefined ? { paidAmount: Number(paidAmount) } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
    },
    include: { items: true, payments: true },
  });
  res.json(purchase);
};

export const deletePurchase = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Purchase not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  await prisma.purchase.delete({ where: { id } });
  res.status(204).send();
};

export const recordSupplierPayment = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { purchaseId, amountPaid, paymentDate, paymentMethod, reference, notes } = req.body;
  if (!purchaseId || amountPaid === undefined) { res.status(400).json({ message: 'purchaseId and amountPaid are required' }); return; }

  const existing = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!existing) { res.status(404).json({ message: 'Purchase not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const payment = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.supplierPayment.create({
      data: {
        purchaseId,
        amountPaid: Number(amountPaid),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || 'cash',
        reference: reference || null,
        notes: notes || null,
      },
    });

    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        paidAmount: { increment: Number(amountPaid) },
      },
    });

    return newPayment;
  });

  res.status(201).json(payment);
};
