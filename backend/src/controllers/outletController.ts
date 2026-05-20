import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

function isAdmin(user: AuthRequest['user'] | undefined) {
  if (!user) return false;
  return user.isSuperAdmin || user.roleId === 'role-admin';
}

export const listOutlets = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  if (user.isSuperAdmin) {
    const tenantId = typeof (req.query as any)?.tenantId === 'string' ? String((req.query as any).tenantId) : undefined;
    if (!tenantId) {
      res.json([]);
      return;
    }
    const outlets = await prisma.outlet.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(outlets);
    return;
  }

  if (!user.tenantId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const outlets = await prisma.outlet.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(outlets);
};

export const createOutlet = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  if (!isAdmin(user)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const { name, address, phone, tenantId: bodyTenantId } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    res.status(400).json({ message: 'Outlet name is required' });
    return;
  }

  let tenantId: string | null = null;
  if (user.isSuperAdmin) {
    if (typeof bodyTenantId === 'string' && bodyTenantId.trim()) {
      tenantId = bodyTenantId.trim();
    } else {
      res.status(400).json({ message: 'tenantId is required' });
      return;
    }
  } else {
    tenantId = user.tenantId;
  }

  if (!tenantId) {
    res.status(400).json({ message: 'tenantId is required' });
    return;
  }

  const outlet = await prisma.outlet.create({
    data: {
      name: trimmedName,
      tenantId,
      address: typeof address === 'string' && address.trim() ? address.trim() : null,
      phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
    },
  });
  res.status(201).json(outlet);
};

export const updateOutlet = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  if (!isAdmin(user)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const id = String(req.params.id);
  const outlet = await prisma.outlet.findUnique({ where: { id } });
  if (!outlet) {
    res.status(404).json({ message: 'Outlet not found' });
    return;
  }

  if (!user.isSuperAdmin) {
    if (!user.tenantId || outlet.tenantId !== user.tenantId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
  }

  const { name, address, phone } = req.body || {};
  const data: any = {};
  if (typeof name === 'string') {
    const trimmed = name.trim();
    if (!trimmed) {
      res.status(400).json({ message: 'Outlet name cannot be empty' });
      return;
    }
    data.name = trimmed;
  }
  if (typeof address === 'string') data.address = address.trim() ? address.trim() : null;
  if (typeof phone === 'string') data.phone = phone.trim() ? phone.trim() : null;

  const updated = await prisma.outlet.update({
    where: { id },
    data,
  });
  res.json(updated);
};

export const deleteOutlet = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  if (!isAdmin(user)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const id = String(req.params.id);
  const outlet = await prisma.outlet.findUnique({ where: { id } });
  if (!outlet) {
    res.status(404).json({ message: 'Outlet not found' });
    return;
  }

  if (!user.isSuperAdmin) {
    if (!user.tenantId || outlet.tenantId !== user.tenantId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
  }

  const outletsInTenant = await prisma.outlet.count({ where: { tenantId: outlet.tenantId } });
  if (outletsInTenant <= 1) {
    res.status(400).json({ message: 'You cannot delete the last remaining outlet.' });
    return;
  }

  const usersOnOutlet = await prisma.user.count({ where: { outletId: outlet.id } });
  if (usersOnOutlet > 0) {
    res.status(400).json({ message: 'Cannot delete outlet with users assigned. Reassign users first.' });
    return;
  }

  try {
    await prisma.outlet.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete outlet' });
  }
};
