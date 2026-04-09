import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getTables = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const tables = await prisma.table.findMany({
    where: { outletId: user.outletId },
    orderBy: { name: 'asc' }
  });
  res.json(tables);
};

export const createTable = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const { name, capacity, areaFloorId } = req.body;
  const table = await prisma.table.create({
    data: {
      name,
      capacity: Number(capacity),
      outletId: user.outletId,
      areaFloorId
    }
  });
  res.status(201).json(table);
};

export const updateTable = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const { name, capacity, areaFloorId, notes, assistanceRequested, assistanceRequestedAt, foodReady } = req.body;

  const table = await prisma.table.findFirst({ where: { id, outletId: user.outletId } });
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
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const { status } = req.body;
  
  const table = await prisma.table.updateMany({
    where: { id, outletId: user.outletId },
    data: { status }
  });
  
  if (table.count === 0) {
     res.status(404).json({ message: 'Table not found or unauthorized' });
     return;
  }
  
  res.json({ message: 'Table status updated' });
};

export const deleteTable = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  
  const result = await prisma.table.deleteMany({
    where: { id, outletId: user.outletId }
  });
  
  if (result.count === 0) {
     res.status(404).json({ message: 'Table not found or unauthorized' });
     return;
  }
  
  res.status(204).send();
};
