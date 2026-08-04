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

const normalizeOrderItems = (items: any[] = []) =>
  items
    .map((it) => ({
      menuItemId: typeof it?.menuItemId === 'string' && it.menuItemId.trim()
        ? it.menuItemId
        : typeof it?.id === 'string' && it.id.trim()
          ? it.id
          : '',
      quantity: Number(it?.quantity || 0),
      unitPrice: Number(it?.unitPrice ?? it?.price ?? 0),
    }))
    .filter((it) => it.menuItemId && it.quantity > 0);

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
    const orders = await prisma.order.findMany({
      where: { outletId: requestedOutletId },
      include: { customer: true, items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
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
    const order = await prisma.order.create({
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
    const existing = await prisma.order.findUnique({ where: { id } });
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

    const order = await prisma.order.update({
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

    res.json(order);
  } catch (error: any) {
    console.error('[orderController] updateOrder error:', error);
    res.status(500).json({ message: 'Failed to update order', detail: error?.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
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

    // Find the order
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

    // Validate return items exist in the order
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'No items to return' });
      return;
    }

    // Calculate return total
    const calculatedReturnAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Store return information in saleData
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

    // Update the order
    const order = await prisma.order.update({
      where: { id },
      data: {
        total: existing.total - calculatedReturnAmount,
        saleData: updatedSaleData,
      },
      include: { customer: true, items: { include: { menuItem: true } } },
    });

    res.json({ sale: order });
  } catch (error: any) {
    console.error('[orderController] returnOrder error:', error);
    res.status(500).json({ message: 'Failed to process return', detail: error?.message });
  }
};
