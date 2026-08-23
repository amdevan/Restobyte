import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const getAccessibleOutletIds = async (user: NonNullable<AuthRequest['user']>) => {
  if (user.isSuperAdmin) return null;
  if (Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0) {
    return (user as any).outletIds.map(String);
  }
  if (user.outletId) {
    return [String(user.outletId)];
  }
  if (user.roleId === 'role-admin') {
    if (!user.tenantId) return null;
    const outlets = await prisma.outlet.findMany({ where: { tenantId: user.tenantId }, select: { id: true } });
    return outlets.map((outlet) => outlet.id);
  }
  return [];
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
      const vn = it?.variationName || null;
      if (menuItemId) {
        // Use composite key to support same item with different variations
        const key = `${menuItemId}__${vn || ''}`;
        map.set(key, vn);
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

    // Only select fields needed by mapBackendOrderToSale to avoid heavy JOINs
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        customerId: true,
        total: true,
        status: true,
        outletId: true,
        saleData: true,
        tableNumber: true,
        customer: { select: { name: true, id: true } },
        items: { select: { menuItemId: true, quantity: true, unitPrice: true, menuItem: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
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
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        saleData: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            menuItem: { select: { name: true } },
          },
        },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Set short cache for polling responses
    res.set('Cache-Control', 'private, max-age=5');
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

    // Extract tableNumber from saleData for Dine In orders
    const tableNumber = normalizedSaleData?.assignedTableId || normalizedSaleData?.tableId || null;

    const variationMap = extractVariationMap(normalizedSaleData || saleData);
    const itemsForStock = normalizedItems.map((it) => {
      const vn = it.variationName || null;
      const mapKey = `${it.menuItemId}__${vn || ''}`;
      return {
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        variationName: (variationMap.has(mapKey) ? variationMap.get(mapKey) : vn) ?? null,
      };
    });

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerId,
          outletId: requestedOutletId,
          tableNumber: tableNumber || null,
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

    // Free table when order is created as COMPLETED
    if (statusValue === 'COMPLETED' && tableNumber) {
      try {
        await prisma.table.update({
          where: { id: tableNumber },
          data: { status: 'Free', occupiedSince: null },
        });
      } catch (e) {
        console.error('[orderController] failed to free table on order creation:', e);
      }
    }

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
    // Build oldItemMap from saleData items (which have variationName) instead of OrderItem records
    const oldSaleDataItems = Array.isArray((existing.saleData as any)?.items) ? (existing.saleData as any).items : [];
    for (const sdItem of oldSaleDataItems) {
      const miId = typeof sdItem?.menuItemId === 'string' ? sdItem.menuItemId : typeof sdItem?.id === 'string' ? sdItem.id : null;
      if (!miId) continue;
      const vn = sdItem?.variationName || null;
      const key = `${miId}__${vn || ''}`;
      const qty = Number(sdItem?.quantity || 0);
      if (qty > 0) {
        oldItemMap.set(key, (oldItemMap.get(key) || 0) + qty);
      }
    }

    const newItemMap = new Map<string, { menuItemId: string; quantity: number; variationName: string | null }>();
    const variationMap = extractVariationMap(normalizedSaleData || saleData);
    for (const it of normalizedItems) {
      const vn = it.variationName || null;
      const mapKey = `${it.menuItemId}__${vn || ''}`;
      const resolvedVn = (variationMap.has(mapKey) ? variationMap.get(mapKey) : vn) ?? null;
      const key = `${it.menuItemId}__${resolvedVn || ''}`;
      const existingEntry = newItemMap.get(key);
      if (existingEntry) {
        existingEntry.quantity += it.quantity;
      } else {
        newItemMap.set(key, { menuItemId: it.menuItemId, quantity: it.quantity, variationName: resolvedVn });
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

    // Free table when order is completed
    if (statusValue === 'COMPLETED' && existing.tableNumber) {
      try {
        await prisma.table.update({
          where: { id: existing.tableNumber },
          data: { status: 'Free', occupiedSince: null },
        });
      } catch (e) {
        console.error('[orderController] failed to free table on order completion:', e);
      }
    } else if (statusValue !== 'COMPLETED' && existing.status === 'COMPLETED' && existing.tableNumber) {
      // Re-occupy table if order is reopened
      try {
        await prisma.table.update({
          where: { id: existing.tableNumber },
          data: { status: 'Occupied', occupiedSince: new Date() },
        });
      } catch (e) {
        console.error('[orderController] failed to occupy table on order reopen:', e);
      }
    }

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

    // Free table when order is completed
    if (statusValue === 'COMPLETED' && existing.tableNumber) {
      try {
        await prisma.table.update({
          where: { id: existing.tableNumber },
          data: { status: 'Free', occupiedSince: null },
        });
      } catch (e) {
        console.error('[orderController] failed to free table on status update:', e);
      }
    } else if (statusValue !== 'COMPLETED' && existing.status === 'COMPLETED' && existing.tableNumber) {
      try {
        await prisma.table.update({
          where: { id: existing.tableNumber },
          data: { status: 'Occupied', occupiedSince: new Date() },
        });
      } catch (e) {
        console.error('[orderController] failed to occupy table on status revert:', e);
      }
    }

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
    // Use saleData items directly since OrderItem records don't store variationName
    const saleDataItems = Array.isArray((existing.saleData as any)?.items) ? (existing.saleData as any).items : [];
    const itemsForRestore: Array<{ menuItemId: string; quantity: number; variationName: string | null }> = [];
    // Group OrderItem quantities by menuItemId to match with saleData
    const orderItemQtyMap = new Map<string, number>();
    for (const it of existing.items) {
      orderItemQtyMap.set(it.menuItemId, (orderItemQtyMap.get(it.menuItemId) || 0) + it.quantity);
    }
    for (const sdItem of saleDataItems) {
      const miId = typeof sdItem?.menuItemId === 'string' ? sdItem.menuItemId : typeof sdItem?.id === 'string' ? sdItem.id : null;
      if (!miId) continue;
      const qty = Number(sdItem?.quantity || orderItemQtyMap.get(miId) || 0);
      if (qty <= 0) continue;
      itemsForRestore.push({
        menuItemId: miId,
        quantity: qty,
        variationName: sdItem?.variationName || null,
      });
    }

    await prisma.$transaction(async (tx) => {
      await deductStockForOrderItems(tx, outletId, itemsForRestore, 'restore');

      // Delete related records in correct order (foreign key dependencies)
      const invoices = await tx.invoice.findMany({ where: { orderId: id }, select: { id: true } });
      const invoiceIds = invoices.map((inv) => inv.id);
      if (invoiceIds.length > 0) {
        await tx.paymentHistory.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await tx.invoice.deleteMany({ where: { orderId: id } });
      }
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });

    // Free table when order is deleted
    if (existing.tableNumber) {
      try {
        // Check if other active orders exist for this table
        const otherOrders = await prisma.order.count({
          where: { tableNumber: existing.tableNumber, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        });
        if (otherOrders === 0) {
          await prisma.table.update({
            where: { id: existing.tableNumber },
            data: { status: 'Free', occupiedSince: null },
          });
        }
      } catch (e) {
        console.error('[orderController] failed to free table on order deletion:', e);
      }
    }

    res.status(204).send();
  } catch (error: any) {
    console.error('[orderController] deleteOrder error:', error);
    res.status(500).json({ message: 'Failed to delete order', detail: error?.message });
  }
};
