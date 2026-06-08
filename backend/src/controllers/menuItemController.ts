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

    // Allow public access to GET menu items for an outlet
    // If user is authenticated, we can do stricter checks, but for public website we need it open
    if (user && !user.isSuperAdmin) {
      if (user.roleId === 'role-admin') {
        if (user.tenantId) {
          const outlet = await prisma.outlet.findFirst({ where: { id: String(outletId), tenantId: user.tenantId } });
          if (!outlet) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
          }
        }
      } else {
        const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
          ? (user as any).outletIds.map(String)
          : (user.outletId ? [String(user.outletId)] : []);
        if (!allowedOutletIds.includes(String(outletId))) {
          res.status(403).json({ message: 'Unauthorized' });
          return;
        }
      }
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
    if (!user) {
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

    const allowedOutletIds = user.isSuperAdmin
      ? null
      : (user.roleId === 'role-admin'
          ? (user.tenantId ? (await prisma.outlet.findMany({ where: { tenantId: user.tenantId }, select: { id: true } })).map(o => o.id) : [])
          : (Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0 ? (user as any).outletIds.map(String) : (user.outletId ? [String(user.outletId)] : [])));

    // Verify category belongs to an allowed outlet
    const category = await prisma.category.findFirst({
      where: { id: categoryId, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) },
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
    if (!user) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const id = req.params.id as string;
    const { name, description, categoryId, price, imageUrl, isVegetarian, variations } = req.body;

    const allowedOutletIds = user.isSuperAdmin
      ? null
      : (user.roleId === 'role-admin'
          ? (user.tenantId ? (await prisma.outlet.findMany({ where: { tenantId: user.tenantId }, select: { id: true } })).map(o => o.id) : [])
          : (Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0 ? (user as any).outletIds.map(String) : (user.outletId ? [String(user.outletId)] : [])));

    // Verify item exists and belongs to user's outlet (via category)
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id,
        category: { ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) },
      },
    });

    if (!existingItem) {
      res.status(404).json({ message: 'Menu item not found or unauthorized' });
      return;
    }

    // If changing category, verify new category belongs to outlet
    if (categoryId && categoryId !== existingItem.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) },
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

    if (variations !== undefined) {
      if (!Array.isArray(variations)) {
        res.status(400).json({ message: 'Variations must be an array' });
        return;
      }

      const normalized = variations.map((v: any) => {
        const vName = typeof v?.name === 'string' ? v.name.trim() : '';
        const vPrice = typeof v?.price === 'number' ? v.price : Number(v?.price);
        return { name: vName, price: vPrice };
      });

      if (normalized.length === 0 || normalized.some(v => !v.name || !Number.isFinite(v.price) || v.price < 0)) {
        res.status(400).json({ message: 'Invalid variations' });
        return;
      }

      data.variations = {
        deleteMany: {},
        create: normalized.map(v => ({ name: v.name, price: v.price })),
      };

      if (numericPrice === undefined) {
        const first = normalized[0];
        if (first) data.price = first.price;
      }
    }

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

    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id,
        category: { ...(allowedOutletIds ? { outletId: { in: allowedOutletIds } } : {}) },
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
