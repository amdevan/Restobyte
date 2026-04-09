import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getMenuItems = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const outletId = (req.query.outletId as string) || (user?.outletId);

  if (!outletId) {
    res.status(400).json({ message: 'Outlet ID is required' });
    return;
  }
  
  const items = await prisma.menuItem.findMany({ 
    where: {
      category: {
        outletId: outletId
      }
    },
    include: { category: true, variations: true } 
  });
  res.json(items);
};

export const createMenuItem = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const { name, description, categoryId, price, imageUrl, isVegetarian, variations } = req.body;
  
  // Verify category belongs to user's outlet
  const category = await prisma.category.findFirst({
    where: { id: categoryId, outletId: user.outletId }
  });

  if (!category) {
    res.status(400).json({ message: 'Invalid category' });
    return;
  }

  const item = await prisma.menuItem.create({
    data: {
      name,
      description,
      category: { connect: { id: categoryId } },
      price,
      imageUrl,
      isVegetarian: !!isVegetarian,
      ...(Array.isArray(variations) && variations.length
        ? { variations: { create: variations.map((v: any) => ({ name: v.name, price: v.price })) } }
        : {}),
    },
    include: { category: true, variations: true },
  });
  res.status(201).json(item);
};

export const updateMenuItem = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const { name, description, categoryId, price, imageUrl, isVegetarian } = req.body;
  
  // Verify item exists and belongs to user's outlet (via category)
  const existingItem = await prisma.menuItem.findFirst({
    where: {
      id,
      category: { outletId: user.outletId }
    }
  });

  if (!existingItem) {
    res.status(404).json({ message: 'Menu item not found or unauthorized' });
    return;
  }

  // If changing category, verify new category belongs to outlet
  if (categoryId && categoryId !== existingItem.categoryId) {
      const category = await prisma.category.findFirst({
          where: { id: categoryId, outletId: user.outletId }
      });
      if (!category) {
          res.status(400).json({ message: 'Invalid category' });
          return;
      }
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: { name, description, categoryId, price, imageUrl, isVegetarian },
    include: { category: true, variations: true },
  });
  res.json(item);
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  
  const existingItem = await prisma.menuItem.findFirst({
    where: {
      id,
      category: { outletId: user.outletId }
    }
  });

  if (!existingItem) {
    res.status(404).json({ message: 'Menu item not found or unauthorized' });
    return;
  }

  await prisma.variation.deleteMany({ where: { menuItemId: id } });
  await prisma.menuItem.delete({ where: { id } });
  res.status(204).send();
};