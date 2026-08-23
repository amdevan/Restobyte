import type { Request, Response } from 'express';
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

// ==================== Stock Items ====================

export const getStockItems = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = (req.query as any).outletId || user.outletId;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const items = await withRetry(() => prisma.stockItem.findMany({
    where: { outletId: String(outletId) },
    orderBy: { name: 'asc' },
  }));
  res.json(items);
};

export const createStockItem = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, name, category, quantity, unit, lowStockThreshold, costPerUnit } = req.body;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const item = await withRetry(() => prisma.stockItem.create({
    data: {
      outletId: String(outletId),
      name,
      category: category || '',
      quantity: Number(quantity) || 0,
      unit: unit || 'unit',
      lowStockThreshold: Number(lowStockThreshold) || 0,
      costPerUnit: Number(costPerUnit) || 0,
    },
  }));
  res.status(201).json(item);
};

export const updateStockItem = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.stockItem.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Stock item not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { name, category, quantity, unit, lowStockThreshold, costPerUnit } = req.body;
  const item = await prisma.stockItem.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
      ...(unit !== undefined ? { unit } : {}),
      ...(lowStockThreshold !== undefined ? { lowStockThreshold: Number(lowStockThreshold) } : {}),
      ...(costPerUnit !== undefined ? { costPerUnit: Number(costPerUnit) } : {}),
    },
  });
  res.json(item);
};

export const deleteStockItem = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.stockItem.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Stock item not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  await prisma.stockItem.delete({ where: { id } });
  res.status(204).send();
};

export const bulkUpsertStockItems = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, items } = req.body;
  const resolvedOutletId = outletId || user.outletId;
  if (!resolvedOutletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!Array.isArray(items)) { res.status(400).json({ message: 'items array is required' }); return; }
  if (!await validateOutletAccess(user, String(resolvedOutletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  for (const item of items) {
    if (item?.id) {
      const existing = await prisma.stockItem.findUnique({ where: { id: String(item.id) }, select: { outletId: true } });
      if (existing && existing.outletId !== String(resolvedOutletId)) {
        res.status(403).json({ message: 'Unauthorized: cross-outlet bulk update blocked' });
        return;
      }
    }
  }

  const results = await prisma.$transaction(async (tx) => {
    return Promise.all(
      items.map((item: any) =>
        tx.stockItem.upsert({
          where: { id: item.id || `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
          update: {
            name: item.name,
            category: item.category,
            quantity: Number(item.quantity) || 0,
            unit: item.unit,
            lowStockThreshold: Number(item.lowStockThreshold) || 0,
            costPerUnit: Number(item.costPerUnit) || 0,
          },
          create: {
            id: item.id,
            outletId: String(resolvedOutletId),
            name: item.name,
            category: item.category || '',
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'unit',
            lowStockThreshold: Number(item.lowStockThreshold) || 0,
            costPerUnit: Number(item.costPerUnit) || 0,
          },
        })
      )
    );
  });
  res.json(results);
};

// ==================== Stock Entries ====================

export const getStockEntries = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = (req.query as any).outletId || user.outletId;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const entries = await withRetry(() => prisma.stockEntry.findMany({
    where: { outletId: String(outletId) },
    include: { items: true },
    orderBy: { date: 'desc' },
  }));
  res.json(entries);
};

export const createStockEntry = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, supplierId, notes, items } = req.body;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!Array.isArray(items) || items.length === 0) { res.status(400).json({ message: 'items array is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const totalCost = items.reduce((sum: number, item: any) => sum + (Number(item.quantityAdded) * Number(item.costPerUnit)), 0);

  // Wrap in transaction so entry creation and stock quantity updates are atomic
  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.stockEntry.create({
      data: {
        outletId: String(outletId),
        supplierId: supplierId || null,
        notes: notes || null,
        totalCost,
        items: {
          create: items.map((item: any) => ({
            stockItemId: item.stockItemId,
            quantityAdded: Number(item.quantityAdded),
            costPerUnit: Number(item.costPerUnit) || 0,
          })),
        },
      },
      include: { items: true },
    });

    // Update stock quantities inside the same transaction
    for (const item of items) {
      await tx.stockItem.update({
        where: { id: item.stockItemId },
        data: {
          quantity: { increment: Number(item.quantityAdded) },
          ...(item.costPerUnit ? { costPerUnit: Number(item.costPerUnit) } : {}),
        },
      });
    }

    return created;
  });

  res.status(201).json(entry);
};

export const deleteStockEntry = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.stockEntry.findUnique({ where: { id }, include: { items: true } });
  if (!existing) { res.status(404).json({ message: 'Stock entry not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  // Reverse stock quantities and delete entry atomically
  await prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      await tx.stockItem.update({
        where: { id: item.stockItemId },
        data: { quantity: { decrement: item.quantityAdded } },
      });
    }
    await tx.stockEntry.delete({ where: { id } });
  });

  res.status(204).send();
};

// ==================== Stock Adjustments ====================

export const getStockAdjustments = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = (req.query as any).outletId || user.outletId;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const adjustments = await prisma.stockAdjustment.findMany({
    where: { outletId: String(outletId) },
    include: { items: true },
    orderBy: { date: 'desc' },
  });
  res.json(adjustments);
};

export const createStockAdjustment = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, reason, items } = req.body;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!Array.isArray(items) || items.length === 0) { res.status(400).json({ message: 'items array is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  // Wrap in transaction: capture previous quantities, create adjustment, and apply atomically
  const adjustment = await prisma.$transaction(async (tx) => {
    // Fetch current quantities for SetTo reversal support
    const stockItemIds = items.map((item: any) => String(item.stockItemId));
    const stockItems = await tx.stockItem.findMany({
      where: { id: { in: stockItemIds } },
      select: { id: true, quantity: true },
    });
    const quantityMap = new Map(stockItems.map(si => [si.id, si.quantity]));

    const created = await tx.stockAdjustment.create({
      data: {
        outletId: String(outletId),
        reason: reason || null,
        items: {
          create: items.map((item: any) => ({
            stockItemId: item.stockItemId,
            quantity: Number(item.quantity),
            adjustmentType: item.adjustmentType,
            previousQuantity: item.adjustmentType === 'SetTo'
              ? (quantityMap.get(String(item.stockItemId)) ?? null)
              : null,
          })),
        },
      },
      include: { items: true },
    });

    // Apply adjustments to stock quantities
    for (const item of items) {
      const qty = Number(item.quantity);
      if (item.adjustmentType === 'Increase') {
        await tx.stockItem.update({ where: { id: item.stockItemId }, data: { quantity: { increment: qty } } });
      } else if (item.adjustmentType === 'Decrease') {
        await tx.stockItem.update({ where: { id: item.stockItemId }, data: { quantity: { decrement: qty } } });
      } else if (item.adjustmentType === 'SetTo') {
        await tx.stockItem.update({ where: { id: item.stockItemId }, data: { quantity: qty } });
      }
    }

    return created;
  });

  res.status(201).json(adjustment);
};

export const deleteStockAdjustment = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.stockAdjustment.findUnique({ where: { id }, include: { items: true } });
  if (!existing) { res.status(404).json({ message: 'Stock adjustment not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  // Reverse adjustments and delete atomically
  await prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      const qty = Number(item.quantity);
      if (item.adjustmentType === 'Increase') {
        await tx.stockItem.update({ where: { id: item.stockItemId }, data: { quantity: { decrement: qty } } });
      } else if (item.adjustmentType === 'Decrease') {
        await tx.stockItem.update({ where: { id: item.stockItemId }, data: { quantity: { increment: qty } } });
      } else if (item.adjustmentType === 'SetTo') {
        // Restore to the quantity before the SetTo was applied
        if (item.previousQuantity != null) {
          await tx.stockItem.update({ where: { id: item.stockItemId }, data: { quantity: item.previousQuantity } });
        }
      }
    }
    await tx.stockAdjustment.delete({ where: { id } });
  });

  res.status(204).send();
};

// ==================== Suppliers ====================

export const getSuppliers = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = (req.query as any).outletId || user.outletId;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const suppliers = await withRetry(() => prisma.supplier.findMany({
    where: { outletId: String(outletId) },
    orderBy: { name: 'asc' },
  }));
  res.json(suppliers);
};

export const createSupplier = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, name, contactPerson, phone, email, address, notes } = req.body;
  if (!outletId || !name) { res.status(400).json({ message: 'outletId and name are required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const supplier = await withRetry(() => prisma.supplier.create({
    data: {
      outletId: String(outletId),
      name,
      contactPerson: contactPerson || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
    },
  }));
  res.status(201).json(supplier);
};

export const updateSupplier = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Supplier not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { name, contactPerson, phone, email, address, notes } = req.body;
  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(contactPerson !== undefined ? { contactPerson } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  });
  res.json(supplier);
};

export const deleteSupplier = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Supplier not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  await prisma.supplier.delete({ where: { id } });
  res.status(204).send();
};

// ==================== Recipes ====================

export const getRecipes = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const outletId = (req.query as any).outletId || user.outletId;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const recipes = await prisma.recipe.findMany({
    where: { outletId: String(outletId) },
    include: { ingredients: { include: { stockItem: true } } },
  });
  res.json(recipes);
};

export const upsertRecipe = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, menuItemId, variationName, yieldQuantity, yieldUnit, notes, ingredients } = req.body;
  if (!outletId || !menuItemId) { res.status(400).json({ message: 'outletId and menuItemId are required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const recipe = await prisma.recipe.upsert({
    where: {
      outletId_menuItemId_variationName: {
        outletId: String(outletId),
        menuItemId,
        variationName: variationName || '',
      },
    },
    update: {
      yieldQuantity: Number(yieldQuantity) || 1,
      yieldUnit: yieldUnit || null,
      notes: notes || null,
    },
    create: {
      outletId: String(outletId),
      menuItemId,
      variationName: variationName || '',
      yieldQuantity: Number(yieldQuantity) || 1,
      yieldUnit: yieldUnit || null,
      notes: notes || null,
    },
  });

  // Replace ingredients
  if (Array.isArray(ingredients)) {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
    await prisma.recipeIngredient.createMany({
      data: ingredients.map((ing: any) => ({
        recipeId: recipe.id,
        stockItemId: ing.stockItemId || null,
        quantityRequired: Number(ing.quantityRequired),
        unit: ing.unit || null,
      })),
    });
  }

  const fullRecipe = await prisma.recipe.findUnique({
    where: { id: recipe.id },
    include: { ingredients: { include: { stockItem: true } } },
  });

  res.status(201).json(fullRecipe);
};

export const deleteRecipe = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const id = req.params.id as string;
  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) { res.status(404).json({ message: 'Recipe not found' }); return; }
  if (!await validateOutletAccess(user, existing.outletId)) { res.status(403).json({ message: 'Unauthorized' }); return; }

  await prisma.recipe.delete({ where: { id } });
  res.status(204).send();
};

// ==================== Waste Stock Deduction ====================

export const deductWasteStock = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) { res.status(403).json({ message: 'Unauthorized' }); return; }

  const { outletId, items } = req.body;
  if (!outletId) { res.status(400).json({ message: 'outletId is required' }); return; }
  if (!Array.isArray(items) || items.length === 0) { res.status(400).json({ message: 'items array is required' }); return; }
  if (!await validateOutletAccess(user, String(outletId))) { res.status(403).json({ message: 'Unauthorized' }); return; }

  // Deduct stock atomically
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const qty = Number(item.quantityWasted);
      if (qty > 0) {
        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: { quantity: { decrement: qty } },
        });
      }
    }
  });

  res.json({ success: true });
};
