import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';

export const getMenuItems = async (_req: Request, res: Response) => {
  const items = await prisma.menuItem.findMany({ include: { category: true, variations: true } });
  res.json(items);
};

export const createMenuItem = async (req: Request, res: Response) => {
  const { name, description, categoryId, price, imageUrl, isVegetarian, variations } = req.body;
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
  const id = req.params.id as string;
  const { name, description, categoryId, price, imageUrl, isVegetarian } = req.body;
  const item = await prisma.menuItem.update({
    where: { id },
    data: { name, description, categoryId, price, imageUrl, isVegetarian },
    include: { category: true, variations: true },
  });
  res.json(item);
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.variation.deleteMany({ where: { menuItemId: id } });
  await prisma.menuItem.delete({ where: { id } });
  res.status(204).send();
};