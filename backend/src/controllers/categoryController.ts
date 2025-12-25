import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
  const { name, description, imageUrl } = req.body;
  const category = await prisma.category.create({ data: { name, description, imageUrl } });
  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, description, imageUrl } = req.body;
  const category = await prisma.category.update({ where: { id }, data: { name, description, imageUrl } });
  res.json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.category.delete({ where: { id } });
  res.status(204).send();
};