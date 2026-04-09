import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getCustomers = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const customers = await prisma.customer.findMany({
    where: { outletId: user.outletId }
  });
  res.json(customers);
};

export const createCustomer = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const { name, email, phone, address, dob, companyName, vatPan, dueAmount } = req.body;
  const customer = await prisma.customer.create({ 
    data: { 
      name, 
      email, 
      phone,
      address,
      dob: dob ? new Date(dob) : null,
      companyName,
      vatPan,
      dueAmount: dueAmount ? Number(dueAmount) : 0,
      outletId: user.outletId
    } 
  });
  res.status(201).json(customer);
};

export const updateCustomer = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const { name, email, phone, address, dob, companyName, vatPan, dueAmount } = req.body;
  
  const customer = await prisma.customer.findFirst({ where: { id, outletId: user.outletId } });
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      address,
      ...(dob !== undefined ? { dob: dob ? (new Date(dob as any) as any) : (null as any) } : {}),
      companyName,
      vatPan,
      ...(dueAmount !== undefined ? { dueAmount: Number(dueAmount) } : {}),
    }
  });
  res.json(updatedCustomer);
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.outletId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  
  const customer = await prisma.customer.findFirst({ where: { id, outletId: user.outletId } });
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }

  await prisma.customer.delete({ where: { id } });
  res.status(204).send();
};
