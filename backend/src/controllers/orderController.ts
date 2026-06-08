import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getOrders = async (req: Request, res: Response) => {
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
  if (!user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (!user.tenantId) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
      const outlet = await prisma.outlet.findFirst({ where: { id: requestedOutletId, tenantId: user.tenantId } });
      if (!outlet) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    } else {
      const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
        ? (user as any).outletIds.map(String)
        : (user.outletId ? [String(user.outletId)] : []);
      if (!allowedOutletIds.includes(requestedOutletId)) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
  }
  const orders = await prisma.order.findMany({
    where: { outletId: requestedOutletId },
    include: { customer: true, items: { include: { menuItem: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
};

export const getOrder = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const allowedOutletIds = user.isSuperAdmin
    ? null
    : (user.roleId === 'role-admin'
        ? (user.tenantId ? (await prisma.outlet.findMany({ where: { tenantId: user.tenantId }, select: { id: true } })).map(o => o.id) : [])
        : (Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0 ? (user as any).outletIds.map(String) : (user.outletId ? [String(user.outletId)] : [])));
  const order = await prisma.order.findFirst({
    where: { id, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) },
    include: { customer: true, items: { include: { menuItem: true } } },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};

export const createOrder = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const { customerId, items, status, outletId } = req.body;
  const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
  const requestedOutletId = (typeof outletId === 'string' ? outletId : undefined) || queryOutletId || (user.outletId ? String(user.outletId) : undefined);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (!user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (!user.tenantId) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
      const outlet = await prisma.outlet.findFirst({ where: { id: requestedOutletId, tenantId: user.tenantId } });
      if (!outlet) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    } else {
      const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
        ? (user as any).outletIds.map(String)
        : (user.outletId ? [String(user.outletId)] : []);
      if (!allowedOutletIds.includes(requestedOutletId)) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
  }
  const statusValue = (status ? String(status).toUpperCase() : 'PENDING');
  const order = await prisma.order.create({
    data: {
      customerId,
      outletId: requestedOutletId,
      status: statusValue as any,
      items: {
        create: items.map((it: any) => ({
          menuItemId: it.menuItemId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      },
    },
    include: { customer: true, items: { include: { menuItem: true } } },
  });
  res.status(201).json(order);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const statusValue = (req.body.status ? String(req.body.status).toUpperCase() : 'PENDING');
  const order = await prisma.order.update({ where: { id }, data: { status: statusValue as any } });
  res.json(order);
};
