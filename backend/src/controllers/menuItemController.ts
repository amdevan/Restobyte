import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    const outletId = (req.query.outletId as string) || user?.outletId;

    if (!outletId) {
      res.status(400).json({ message: 'Outlet ID is required' });
      return;
    }

    const items = await prisma.menuItem.findMany({
      where: {
        category: {
          outletId: outletId,
        },
      },
      include: { category: true, variations: true },
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user.outletId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { name, description, categoryId, price, imageUrl, isVegetarian, variations } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ message: 'Name is required' });
      return;
    }
    if (!categoryId || typeof categoryId !== 'string') {
      res.status(400).json({ message: 'Category is required' });
      return;
    }

    // Verify category belongs to user's outlet
    const category = await prisma.category.findFirst({
      where: { id: categoryId, outletId: user.outletId },
    });

    if (!category) {
      res.status(400).json({ message: 'Invalid category' });
      return;
    }

    const numericPrice = typeof price === 'number' ? price : Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      res.status(400).json({ message: 'Invalid price' });
      return;
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        category: { connect: { id: categoryId } },
        price: numericPrice,
        imageUrl,
        isVegetarian: !!isVegetarian,
        ...(Array.isArray(variations) && variations.length
          ? { variations: { create: variations.map((v: any) => ({ name: v.name, price: Number(v.price) })) } }
          : {}),
      },
      include: { category: true, variations: true },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
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
        category: { outletId: user.outletId },
      },
    });

    if (!existingItem) {
      res.status(404).json({ message: 'Menu item not found or unauthorized' });
      return;
    }

    // If changing category, verify new category belongs to outlet
    if (categoryId && categoryId !== existingItem.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, outletId: user.outletId },
      });
      if (!category) {
        res.status(400).json({ message: 'Invalid category' });
        return;
      }
    }

    const numericPrice = price === undefined ? undefined : (typeof price === 'number' ? price : Number(price));
    if (numericPrice !== undefined && (!Number.isFinite(numericPrice) || numericPrice < 0)) {
      res.status(400).json({ message: 'Invalid price' });
      return;
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (numericPrice !== undefined) data.price = numericPrice;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (isVegetarian !== undefined) data.isVegetarian = isVegetarian;

    const item = await prisma.menuItem.update({
      where: { id },
      data: data as any,
      include: { category: true, variations: true },
    });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user || !user.outletId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const id = req.params.id as string;

    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id,
        category: { outletId: user.outletId },
      },
    });

    if (!existingItem) {
      res.status(404).json({ message: 'Menu item not found or unauthorized' });
      return;
    }

    await prisma.variation.deleteMany({ where: { menuItemId: id } });
    await prisma.menuItem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};
