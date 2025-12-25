import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { Prisma } from '@prisma/client';

export const getOrders = async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: { customer: true, items: { include: { menuItem: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
};

export const getOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { menuItem: true } } },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};

export const createOrder = async (req: Request, res: Response) => {
  const { customerId, items, status } = req.body;
  const statusValue = (status ? String(status).toUpperCase() : 'PENDING');
  const order = await prisma.order.create({
    data: {
      customerId,
      status: statusValue as any,
      items: {
        create: items.map((it: any) => ({
          menuItemId: it.menuItemId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      },
    },
    include: { customer: true, items: { include: { menuItem: true } } },
  });
  res.status(201).json(order);
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const statusValue = (req.body.status ? String(req.body.status).toUpperCase() : 'PENDING');
  const order = await prisma.order.update({ where: { id }, data: { status: statusValue as any } });
  res.json(order);
};
