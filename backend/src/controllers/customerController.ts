import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';

export const getCustomers = async (_req: Request, res: Response) => {
  const customers = await prisma.customer.findMany();
  res.json(customers);
};

export const createCustomer = async (req: Request, res: Response) => {
  const { name, email, phone } = req.body;
  const customer = await prisma.customer.create({ data: { name, email, phone } });
  res.status(201).json(customer);
};

export const updateCustomer = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, email, phone } = req.body;
  const customer = await prisma.customer.update({ where: { id }, data: { name, email, phone } });
  res.json(customer);
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.customer.delete({ where: { id } });
  res.status(204).send();
};