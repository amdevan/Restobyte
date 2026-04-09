import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getCategories = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const categories = await prisma.category.findMany({ 
    where: { outletId: user.outletId },
    orderBy: { name: 'asc' } 
  });
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const { name } = req.body;
  const category = await prisma.category.create({ 
    data: { 
      name,
      outletId: user.outletId
    } 
  });
  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const { name } = req.body;
  
  const existingCategory = await prisma.category.findFirst({
    where: { id, outletId: user.outletId }
  });
  
  if (!existingCategory) {
    res.status(404).json({ message: 'Category not found or unauthorized' });
    return;
  }

  const category = await prisma.category.update({ where: { id }, data: { name } });
  res.json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  
  const existingCategory = await prisma.category.findFirst({
    where: { id, outletId: user.outletId }
  });
  
  if (!existingCategory) {
    res.status(404).json({ message: 'Category not found or unauthorized' });
    return;
  }

  await prisma.category.delete({ where: { id } });
  res.status(204).send();
};
