import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getCustomers = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
  const outletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);
  if (!outletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }

  if (!user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (!user.tenantId) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
      const outlet = await prisma.outlet.findFirst({ where: { id: outletId, tenantId: user.tenantId } });
      if (!outlet) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    } else {
      const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
        ? (user as any).outletIds.map(String)
        : (user.outletId ? [String(user.outletId)] : []);
      if (!allowedOutletIds.includes(outletId)) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
  }

  const customers = await prisma.customer.findMany({
    where: { outletId }
  });
  res.json(customers);
};

export const createCustomer = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const { name, email, phone, address, dob, companyName, vatPan, dueAmount, outletId: bodyOutletId } = req.body;
  const outletId = bodyOutletId ? String(bodyOutletId) : (user.outletId ? String(user.outletId) : undefined);
  if (!outletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }

  if (!user.outletId || String(user.outletId) !== outletId) {
    if (!user.isSuperAdmin) {
      if (!user.tenantId) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
      const outlet = await prisma.outlet.findFirst({ where: { id: outletId, tenantId: user.tenantId } });
      if (!outlet) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
  }

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
      outletId
    } 
  });
  res.status(201).json(customer);
};

export const updateCustomer = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  const { name, email, phone, address, dob, companyName, vatPan, dueAmount } = req.body;
  
  const customer = await prisma.customer.findFirst({ where: { id } });
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }

  const customerOutletId = customer.outletId ? String(customer.outletId) : undefined;
  if (!user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (!user.tenantId || !customerOutletId) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
      const outlet = await prisma.outlet.findFirst({ where: { id: customerOutletId, tenantId: user.tenantId } });
      if (!outlet) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    } else {
      const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
        ? (user as any).outletIds.map(String)
        : (user.outletId ? [String(user.outletId)] : []);
      if (!customerOutletId || !allowedOutletIds.includes(customerOutletId)) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
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
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const id = req.params.id as string;
  
  const customer = await prisma.customer.findFirst({ where: { id } });
  if (!customer) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }

  const customerOutletId = customer.outletId ? String(customer.outletId) : undefined;
  if (!user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (!user.tenantId || !customerOutletId) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
      const outlet = await prisma.outlet.findFirst({ where: { id: customerOutletId, tenantId: user.tenantId } });
      if (!outlet) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    } else {
      const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
        ? (user as any).outletIds.map(String)
        : (user.outletId ? [String(user.outletId)] : []);
      if (!customerOutletId || !allowedOutletIds.includes(customerOutletId)) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
  }

  await prisma.customer.delete({ where: { id } });
  res.status(204).send();
};
