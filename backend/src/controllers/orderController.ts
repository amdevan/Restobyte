import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const getAccessibleOutletIds = async (user: NonNullable<AuthRequest['user']>) => {
  if (user.isSuperAdmin) return null;
  if (user.roleId === 'role-admin') {
    if (!user.tenantId) return [];
    const outlets = await prisma.outlet.findMany({ where: { tenantId: user.tenantId }, select: { id: true } });
    return outlets.map((outlet) => outlet.id);
  }
  return Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
    ? (user as any).outletIds.map(String)
    : (user.outletId ? [String(user.outletId)] : []);
};

const canAccessOutlet = async (user: NonNullable<AuthRequest['user']>, outletId?: string | null) => {
  if (!outletId) return false;
  const allowedOutletIds = await getAccessibleOutletIds(user);
  return allowedOutletIds === null || allowedOutletIds.includes(String(outletId));
};

const normalizeOrderItems = (items: any[] = []) => {
  const mapped = items
    .map((it) => ({
      menuItemId: typeof it?.menuItemId === 'string' && it.menuItemId.trim()
        ? it.menuItemId
        : typeof it?.id === 'string' && it.id.trim()
          ? it.id
          : '',
      quantity: Number(it?.quantity || 0),
      unitPrice: Number(it?.unitPrice ?? it?.price ?? 0),
      variationName: it?.variationName || null,
      notes: it?.notes || it?.note || null,
    }))
    .filter((it) => it.menuItemId && it.quantity > 0);

  const merged = new Map<string, { menuItemId: string; quantity: number; unitPrice: number; variationName: string | null; notes: string | null }>();
  for (const item of mapped) {
    const key = `${item.menuItemId}__${item.variationName || ''}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.set(key, { ...item });
    }
  }
  return Array.from(merged.values());
};

const normalizeSaleData = (saleData: any, outletId: string, customerId?: string | null) => {
  if (!saleData || typeof saleData !== 'object') return null;
  return {
    ...saleData,
    outletId,
    ...(customerId ? { customerId } : {}),
  };
};

const deriveStatusValue = (explicitStatus: unknown, saleData: any) => {
  if (typeof explicitStatus === 'string' && explicitStatus.trim()) return explicitStatus.toUpperCase();
  if (saleData && typeof saleData === 'object' && saleData.isClosed === true) return 'COMPLETED';
  return 'PENDING';
};

const extractVariationMap = (saleData: any): Map<string, string | null> => {
  const map = new Map<string, string | null>();
  if (saleData && Array.isArray(saleData.items)) {
    for (const it of saleData.items) {
      const menuItemId = typeof it?.menuItemId === 'string' ? it.menuItemId : typeof it?.id === 'string' ? it.id : null;
      if (menuItemId) {
        map.set(menuItemId, it?.variationName || null);
      }
    }
  }
  return map;
};

async function deductStockForOrderItems(
  prismaTx: any,
  outletId: string,
  items: Array<{ menuItemId: string; quantity: number; variationName?: string | null }>,
  direction: 'deduct' | 'restore' = 'deduct'
) {
  const directionFactor = direction === 'deduct' ? -1 : 1;

  for (const item of items) {
    const variationName = item.variationName || null;

    let recipe = await prismaTx.recipe.findUnique({
      where: {
        outletId_menuItemId_variationName: {
          outletId,
          menuItemId: item.menuItemId,
          variationName: variationName || '',
        },
      },
      include: { ingredients: true },
    });

    if (!recipe && variationName) {
      recipe = await prismaTx.recipe.findUnique({
        where: {
          outletId_menuItemId_variationName: {
            outletId,
            menuItemId: item.menuItemId,
            variationName: '',
          },
        },
        include: { ingredients: true },
      });
    }

    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      continue;
    }

    const yieldQty = Number(recipe.yieldQuantity) || 1;

    for (const ingredient of recipe.ingredients) {
      if (!ingredient.stockItemId) continue;

      const rawChange = (Number(ingredient.quantityRequired) || 0) * item.quantity * (1 / yieldQty) * directionFactor;
      const qtyChange = Math.round(rawChange * 10000) / 10000;

      if (qtyChange === 0) continue;

      try {
        if (qtyChange > 0) {
          await prismaTx.stockItem.update({
            where: { id: ingredient.stockItemId, outletId },
            data: { quantity: { increment: qtyChange } },
          });
        } else {
          await prismaTx.stockItem.update({
            where: { id: ingredient.stockItemId, outletId },
            data: { quantity: { decrement: Math.abs(qtyChange) } },
          });
        }
      } catch (e: any) {
        console.warn(`[deductStockForOrderItems] stock update skipped for ${ingredient.stockItemId}:`, e?.message);
      }
    }
  }
}

export const getOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
    const requestedOutletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);
    if (!requestedOutletId) {
      res.status(400).json({ message: 'outletId is required' });
      return;
    }
    if (!(await canAccessOutlet(user, requestedOutletId))) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    // Optional date filtering (dates are in local YYYY-MM-DD format)
    const fromDate = typeof (req.query as any)?.from === 'string' ? (req.query as any).from : undefined;
    const toDate = typeof (req.query as any)?.to === 'string' ? (req.query as any).to : undefined;
    // tzOffset: client's UTC offset in minutes (e.g., Nepal = +345)
    const tzOffsetMin = typeof (req.query as any)?.tzOffset === 'string'
      ? parseInt((req.query as any).tzOffset, 10)
      : new Date().getTimezoneOffset(); // fallback: server's own offset

    const whereClause: any = { outletId: requestedOutletId };
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) {
        // Convert local date start to UTC: local midnight = UTC midnight + tzOffset
        const d = new Date(fromDate + 'T00:00:00.000Z');
        d.setMinutes(d.getMinutes() - tzOffsetMin);
        whereClause.createdAt.gte = d;
      }
      if (toDate) {
        // End of local day = next day local midnight - 1ms, converted to UTC
        const d = new Date(toDate + 'T00:00:00.000Z');
        d.setDate(d.getDate() + 1);
        d.setMinutes(d.getMinutes() - tzOffsetMin);
        d.setMilliseconds(d.getMilliseconds() - 1);
        whereClause.createdAt.lte = d;
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { customer: true, items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit to prevent loading too many orders at once
    });
    res.json(orders);
  } catch (error: any) {
    console.error('[orderController] getOrders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders', detail: error?.message });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const id = req.params.id as string;
    const allowedOutletIds = await getAccessibleOutletIds(user);
    const order = await prisma.order.findFirst({
      where: { id, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) },
      include: { customer: true, items: { include: { menuItem: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error: any) {
    console.error('[orderController] getOrder error:', error);
    res.status(500).json({ message: 'Failed to fetch order', detail: error?.message });
  }
};

export const getPublicOrder = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findFirst({
      where: { id },
      include: { 
        customer: true, 
        items: { include: { menuItem: true } },
        outlet: true
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error: any) {
    console.error('[orderController] getPublicOrder error:', error);
    res.status(500).json({ message: 'Failed to fetch order', detail: error?.message });
  }
};

export const createPublicOrder = async (req: Request, res: Response) => {
  try {
    const { outletId, tableId, customerName, customerPhone, items, note } = req.body;
    if (!outletId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'outletId and items are required' });
      return;
    }
    const normalized = normalizeOrderItems(items);
    if (normalized.length === 0) {
      res.status(400).json({ message: 'No valid items' });
      return;
    }
    const total = normalized.reduce((sum: number, it: any) => sum + it.quantity * it.unitPrice, 0);

    let tableName: string | null = null;
    if (tableId) {
      const tableRecord = await prisma.table.findUnique({
        where: { id: tableId },
        select: { name: true },
      });
      tableName = tableRecord?.name || null;
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          outletId,
          tableNumber: tableId || null,
          status: 'PENDING',
          total,
          saleData: {
            customerName: customerName || 'Walk-in Customer',
            customerPhone: customerPhone || '',
            note: note || '',
            source: 'qr-menu',
            orderType: 'Dine In',
            assignedTableId: tableId || null,
            assignedTableName: tableName,
            items: normalized,
          },
          items: {
            create: normalized.map((it: any) => ({
              menuItemId: it.menuItemId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            })),
          },
        },
        include: { items: { include: { menuItem: true } } },
      });

      await deductStockForOrderItems(tx, outletId, normalized, 'deduct');

      return created;
    });

    if (tableId) {
      try {
        await prisma.table.update({
          where: { id: tableId },
          data: { status: 'Occupied', occupiedSince: new Date() },
        });
      } catch (e) {
        console.error('[public order] failed to update table status:', e);
      }
    }

    res.status(201).json({ orderId: order.id, order });
  } catch (error: any) {
    console.error('[public order] error:', error);
    res.status(500).json({ message: 'Failed to create order', detail: error?.message });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { customerId, items, status, outletId, total, saleData } = req.body;
    const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
    const requestedOutletId = (typeof outletId === 'string' ? outletId : undefined) || queryOutletId || (user.outletId ? String(user.outletId) : undefined);
    if (!requestedOutletId) {
      res.status(400).json({ message: 'outletId is required' });
      return;
    }
    if (!(await canAccessOutlet(user, requestedOutletId))) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const normalizedItems = normalizeOrderItems(Array.isArray(items) ? items : []);
    const normalizedSaleData = normalizeSaleData(saleData, requestedOutletId, typeof customerId === 'string' ? customerId : undefined);
    const statusValue = deriveStatusValue(status, normalizedSaleData);

    const variationMap = extractVariationMap(normalizedSaleData || saleData);
    const itemsForStock = normalizedItems.map((it) => ({
      menuItemId: it.menuItemId,
      quantity: it.quantity,
      variationName: (variationMap.has(it.menuItemId) ? variationMap.get(it.menuItemId) : it.variationName) ?? null,
    }));

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerId,
          outletId: requestedOutletId,
          status: statusValue as any,
          total: Number(total ?? normalizedSaleData?.totalAmount ?? 0),
          saleData: normalizedSaleData,
          items: {
            create: normalizedItems.map((it: any) => ({
              menuItemId: it.menuItemId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            })),
          },
        },
        include: { customer: true, items: { include: { menuItem: true } } },
      });

      await deductStockForOrderItems(tx, requestedOutletId, itemsForStock, 'deduct');

      return created;
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error('[orderController] createOrder error:', error);
    res.status(500).json({ message: 'Failed to create order', detail: error?.message });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;
    const existing = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!existing) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (!(await canAccessOutlet(user, existing.outletId))) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const { customerId, items, status, total, saleData } = req.body;
    const normalizedItems = normalizeOrderItems(Array.isArray(items) ? items : []);
    const normalizedSaleData = normalizeSaleData(
      saleData,
      String(existing.outletId || (typeof saleData?.outletId === 'string' ? saleData.outletId : '')),
      typeof customerId === 'string' ? customerId : existing.customerId
    );
    const statusValue = deriveStatusValue(status, normalizedSaleData);

    const outletId = String(existing.outletId);

    const oldItemMap = new Map<string, number>();
    for (const it of existing.items) {
      const key = `${it.menuItemId}__${(it as any).variationName || ''}`;
      oldItemMap.set(key, (oldItemMap.get(key) || 0) + it.quantity);
    }

    const newItemMap = new Map<string, { menuItemId: string; quantity: number; variationName: string | null }>();
    const variationMap = extractVariationMap(normalizedSaleData || saleData);
    for (const it of normalizedItems) {
      const vn = (variationMap.has(it.menuItemId) ? variationMap.get(it.menuItemId) : (it.variationName || null)) ?? null;
      const key = `${it.menuItemId}__${vn || ''}`;
      const existingEntry = newItemMap.get(key);
      if (existingEntry) {
        existingEntry.quantity += it.quantity;
      } else {
        newItemMap.set(key, { menuItemId: it.menuItemId, quantity: it.quantity, variationName: vn });
      }
    }

    const allKeys = new Set([...oldItemMap.keys(), ...newItemMap.keys()]);
    const deltaItems: Array<{ menuItemId: string; quantity: number; variationName: string | null }> = [];
    for (const key of allKeys) {
      const oldQty = oldItemMap.get(key) || 0;
      const newEntry = newItemMap.get(key);
      const newQty = newEntry ? newEntry.quantity : 0;
      const diff = newQty - oldQty;
      if (diff !== 0 && newEntry) {
        deltaItems.push({
          menuItemId: newEntry.menuItemId,
          quantity: Math.abs(diff),
          variationName: newEntry.variationName,
        });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          customerId: typeof customerId === 'string' || customerId === null ? customerId : existing.customerId,
          total: Number(total ?? normalizedSaleData?.totalAmount ?? existing.total ?? 0),
          status: statusValue as any,
          saleData: normalizedSaleData ?? existing.saleData,
          ...(Array.isArray(items)
            ? {
                items: {
                  deleteMany: {},
                  create: normalizedItems.map((it) => ({
                    menuItemId: it.menuItemId,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                  })),
                },
              }
            : {}),
        },
        include: { customer: true, items: { include: { menuItem: true } } },
      });

      for (const delta of deltaItems) {
        const key = `${delta.menuItemId}__${delta.variationName || ''}`;
        const oldQty = oldItemMap.get(key) || 0;
        const newEntry = newItemMap.get(key);
        const newQty = newEntry ? newEntry.quantity : 0;
        const diff = newQty - oldQty;

        if (diff > 0) {
          await deductStockForOrderItems(tx, outletId, [{
            menuItemId: delta.menuItemId,
            quantity: diff,
            variationName: delta.variationName,
          }], 'deduct');
        } else if (diff < 0) {
          await deductStockForOrderItems(tx, outletId, [{
            menuItemId: delta.menuItemId,
            quantity: Math.abs(diff),
            variationName: delta.variationName,
          }], 'restore');
        }
      }

      return updated;
    });

    res.json(order);
  } catch (error: any) {
    console.error('[orderController] updateOrder error:', error);
    res.status(500).json({ message: 'Failed to update order', detail: error?.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (!(await canAccessOutlet(user, existing.outletId))) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const statusValue = (req.body.status ? String(req.body.status).toUpperCase() : 'PENDING');
    const order = await prisma.order.update({ where: { id }, data: { status: statusValue as any } });
    res.json(order);
  } catch (error: any) {
    console.error('[orderController] updateOrderStatus error:', error);
    res.status(500).json({ message: 'Failed to update order status', detail: error?.message });
  }
};

export const returnOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;
    const { items, returnAmount, reason, refundMethod, refundDate, outletId } = req.body;

    const existing = await prisma.order.findUnique({ 
      where: { id },
      include: { items: true }
    });
    
    if (!existing) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (!(await canAccessOutlet(user, existing.outletId))) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'No items to return' });
      return;
    }

    const calculatedReturnAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const currentSaleData = (existing.saleData as any) || {};
    const existingReturns = currentSaleData.returns || [];
    
    const newReturn = {
      id: `ret-${Date.now()}`,
      items,
      returnAmount: calculatedReturnAmount,
      reason,
      refundMethod,
      refundDate,
      outletId: existing.outletId,
      createdAt: new Date().toISOString(),
    };

    const updatedSaleData = {
      ...currentSaleData,
      returns: [...existingReturns, newReturn],
      totalAmount: (currentSaleData.totalAmount || existing.total) - calculatedReturnAmount,
    };

    const returnItemsForStock = normalizeOrderItems(items);

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          total: existing.total - calculatedReturnAmount,
          saleData: updatedSaleData,
        },
        include: { customer: true, items: { include: { menuItem: true } } },
      });

      await deductStockForOrderItems(tx, String(existing.outletId), returnItemsForStock, 'restore');

      return updated;
    });

    res.json({ sale: order });
  } catch (error: any) {
    console.error('[orderController] returnOrder error:', error);
    res.status(500).json({ message: 'Failed to process return', detail: error?.message });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const id = req.params.id as string;

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (!(await canAccessOutlet(user, existing.outletId))) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const outletId = String(existing.outletId);
    const variationMap = extractVariationMap(existing.saleData as any);
    const itemsForRestore = existing.items.map((it) => ({
      menuItemId: it.menuItemId,
      quantity: it.quantity,
      variationName: (variationMap.has(it.menuItemId) ? variationMap.get(it.menuItemId) : null) ?? null,
    }));

    await prisma.$transaction(async (tx) => {
      await deductStockForOrderItems(tx, outletId, itemsForRestore, 'restore');

      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('[orderController] deleteOrder error:', error);
    res.status(500).json({ message: 'Failed to delete order', detail: error?.message });
  }
};
