import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getTables = async (req: Request, res: Response) => {
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
  const tables = await prisma.table.findMany({
    where: { outletId: requestedOutletId },
    orderBy: { name: 'asc' }
  });
  res.json(tables);
};

export const createTable = async (req: Request, res: Response) => {
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
  const { name, capacity, areaFloorId } = req.body;
  const table = await prisma.table.create({
    data: {
      name,
      capacity: Number(capacity),
      outletId: requestedOutletId,
      areaFloorId
    }
  });
  res.status(201).json(table);
};

export const updateTable = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const { name, capacity, areaFloorId, notes, assistanceRequested, assistanceRequestedAt, foodReady } = req.body;

  const allowedOutletIds = user.isSuperAdmin
    ? null
    : (user.roleId === 'role-admin'
        ? (user.tenantId ? (await prisma.outlet.findMany({ where: { tenantId: user.tenantId }, select: { id: true } })).map(o => o.id) : [])
        : (Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0 ? (user as any).outletIds.map(String) : (user.outletId ? [String(user.outletId)] : [])));

  const table = await prisma.table.findFirst({ where: { id, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) } });
  if (!table) {
    res.status(404).json({ message: 'Table not found' });
    return;
  }

  const updatedTable = await prisma.table.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
      ...(areaFloorId !== undefined ? { areaFloorId } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(assistanceRequested !== undefined ? { assistanceRequested } : {}),
      ...(assistanceRequestedAt !== undefined ? { assistanceRequestedAt } : {}),
      ...(foodReady !== undefined ? { foodReady } : {}),
    }
  });
  res.json(updatedTable);
};

export const updateTableStatus = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const { status } = req.body;

  const allowedOutletIds = user.isSuperAdmin
    ? null
    : (user.roleId === 'role-admin'
        ? (user.tenantId ? (await prisma.outlet.findMany({ where: { tenantId: user.tenantId }, select: { id: true } })).map(o => o.id) : [])
        : (Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0 ? (user as any).outletIds.map(String) : (user.outletId ? [String(user.outletId)] : [])));

  const existing = await prisma.table.findFirst({ where: { id, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) } });
  if (!existing) {
    res.status(404).json({ message: 'Table not found or unauthorized' });
    return;
  }

  const statusValue = typeof status === 'string' ? status : String(status);
  const updatedTable = await prisma.table.update({
    where: { id },
    data: {
      status: statusValue,
      occupiedSince: statusValue === 'Occupied' ? new Date() : null,
    },
  });

  res.json(updatedTable);
};

export const deleteTable = async (req: Request, res: Response) => {
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

  const result = await prisma.table.deleteMany({
    where: { id, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) }
  });
  
  if (result.count === 0) {
     res.status(404).json({ message: 'Table not found or unauthorized' });
     return;
  }
  
  res.status(204).send();
};
