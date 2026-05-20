import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

function isAdmin(user: AuthRequest['user'] | undefined) {
  if (!user) return false;
  return user.isSuperAdmin || user.roleId === 'role-admin';
}

async function ensureOutletBelongsToTenant(outletId: string, tenantId: string) {
  const outlet = await prisma.outlet.findFirst({ where: { id: outletId, tenantId } });
  return Boolean(outlet);
}

export const getUsers = async (req: Request, res: Response) => {
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

  const outletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;

  if (user.isSuperAdmin) {
    const tenantId = typeof (req.query as any)?.tenantId === 'string' ? String((req.query as any).tenantId) : undefined;
    const users = await prisma.user.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(outletId ? { outletId } : {}),
      },
      select: {
        id: true,
        username: true,
        roleId: true,
        outletId: true,
        tenantId: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
    return;
  }

  if (!user.tenantId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  if (outletId) {
    const allowed = await ensureOutletBelongsToTenant(outletId, user.tenantId);
    if (!allowed) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
  }

  const users = await prisma.user.findMany({
    where: { tenantId: user.tenantId, ...(outletId ? { outletId } : {}) },
    select: {
      id: true,
      username: true,
      roleId: true,
      outletId: true,
      tenantId: true,
      isActive: true,
      isSuperAdmin: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!isAdmin(user)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const { username, password, roleId, outletId, isActive, isSuperAdmin, tenantId: bodyTenantId } = req.body || {};
  const trimmedUsername = typeof username === 'string' ? username.trim() : '';
  const rawPassword = typeof password === 'string' ? password : '';
  const targetOutletId = typeof outletId === 'string' ? outletId : '';

  if (!trimmedUsername || !rawPassword || rawPassword.length < 6 || !targetOutletId) {
    res.status(400).json({ message: 'username, password (min 6), and outletId are required' });
    return;
  }

  let tenantId: string | null = null;
  if (user?.isSuperAdmin) {
    if (typeof bodyTenantId === 'string' && bodyTenantId.trim()) {
      tenantId = bodyTenantId.trim();
    } else {
      const outlet = await prisma.outlet.findUnique({ where: { id: targetOutletId } });
      tenantId = outlet?.tenantId ?? null;
    }
  } else {
    tenantId = user?.tenantId ?? null;
  }

  if (!tenantId) {
    res.status(400).json({ message: 'tenantId is required' });
    return;
  }

  const allowedOutlet = await ensureOutletBelongsToTenant(targetOutletId, tenantId);
  if (!allowedOutlet) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { username: trimmedUsername } });
  if (existing) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);

  const created = await prisma.user.create({
    data: {
      username: trimmedUsername,
      password: hashedPassword,
      roleId: typeof roleId === 'string' ? roleId : null,
      outletId: targetOutletId,
      tenantId,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      isSuperAdmin: user?.isSuperAdmin ? Boolean(isSuperAdmin) : false,
    },
    select: {
      id: true,
      username: true,
      roleId: true,
      outletId: true,
      tenantId: true,
      isActive: true,
      isSuperAdmin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(201).json(created);
};

export const updateUser = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const actor = auth.user;
  if (!isAdmin(actor)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const id = String(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (!actor?.isSuperAdmin) {
    if (!actor?.tenantId || existing.tenantId !== actor.tenantId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
  }

  const { username, password, roleId, outletId, isActive, isSuperAdmin } = req.body || {};
  const nextUsername = typeof username === 'string' ? username.trim() : undefined;
  const nextOutletId = typeof outletId === 'string' ? outletId : undefined;

  if (nextUsername && nextUsername !== existing.username) {
    const taken = await prisma.user.findUnique({ where: { username: nextUsername } });
    if (taken) {
      res.status(400).json({ message: 'Username already exists' });
      return;
    }
  }

  const tenantId = existing.tenantId;
  if (nextOutletId) {
    if (!tenantId) {
      res.status(400).json({ message: 'User has no tenantId; cannot change outlet' });
      return;
    }
    const allowedOutlet = await ensureOutletBelongsToTenant(nextOutletId, tenantId);
    if (!allowedOutlet) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
  }

  const data: any = {
    ...(nextUsername ? { username: nextUsername } : {}),
    ...(typeof roleId === 'string' ? { roleId } : {}),
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(nextOutletId ? { outletId: nextOutletId } : {}),
    ...(actor?.isSuperAdmin ? { isSuperAdmin: Boolean(isSuperAdmin) } : {}),
  };

  if (typeof password === 'string' && password.length > 0) {
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(password, salt);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      roleId: true,
      outletId: true,
      tenantId: true,
      isActive: true,
      isSuperAdmin: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(updated);
};

export const deleteUser = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const actor = auth.user;
  if (!isAdmin(actor)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const id = String(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (!actor?.isSuperAdmin) {
    if (!actor?.tenantId || existing.tenantId !== actor.tenantId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
  }

  if (actor?.id === id) {
    res.status(400).json({ message: 'Cannot delete your own user' });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.status(204).send();
};
