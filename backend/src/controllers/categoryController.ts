import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getCategories = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
  const requestedOutletId = queryOutletId || (user?.outletId ? String(user.outletId) : undefined);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (user && !user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (user.tenantId) {
        const outlet = await prisma.outlet.findFirst({ where: { id: requestedOutletId, tenantId: user.tenantId } });
        if (!outlet) {
          res.status(403).json({ message: 'Unauthorized' });
          return;
        }
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
  const categories = await prisma.category.findMany({ 
    where: { outletId: requestedOutletId },
    orderBy: { name: 'asc' } 
  });
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
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
  const { name, description, imageUrl } = req.body;
  const category = await prisma.category.create({ 
    data: { 
      name,
      description,
      imageUrl,
      outletId: requestedOutletId
    } 
  });
  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
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
  if (user && !user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (user.tenantId) {
        const outlet = await prisma.outlet.findFirst({ where: { id: requestedOutletId, tenantId: user.tenantId } });
        if (!outlet) {
          res.status(403).json({ message: 'Unauthorized' });
          return;
        }
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
  const id = req.params.id as string;
  const { name, description, imageUrl } = req.body;
  
  const existingCategory = await prisma.category.findFirst({
    where: { id, outletId: requestedOutletId }
  });
  
  if (!existingCategory) {
    res.status(404).json({ message: 'Category not found or unauthorized' });
    return;
  }

  const category = await prisma.category.update({ 
    where: { id }, 
    data: { 
      name,
      description,
      imageUrl
    } 
  });
  res.json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
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
  const id = req.params.id as string;
  
  const existingCategory = await prisma.category.findFirst({
    where: { id, outletId: requestedOutletId }
  });
  
  if (!existingCategory) {
    res.status(404).json({ message: 'Category not found or unauthorized' });
    return;
  }

  await prisma.category.delete({ where: { id } });
  res.status(204).send();
};
