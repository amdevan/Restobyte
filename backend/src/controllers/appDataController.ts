import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const getAccessibleOutletIds = async (user: NonNullable<AuthRequest['user']>) => {
  if (user.isSuperAdmin) return null;
  if (user.roleId === 'role-admin') {
    if (!user.tenantId) return [];
    const outlets = await prisma.outlet.findMany({ where: { tenantId: user.tenantId }, select: { id: true } });
    return outlets.map((outlet) => outlet.id);
  }
  return Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
    ? (user as any).outletIds.map(String)
    : (user.outletId ? [String(user.outletId)] : []);
};

const canAccessOutlet = async (user: NonNullable<AuthRequest['user']>, outletId?: string | null) => {
  if (!outletId) return false;
  const allowedOutletIds = await getAccessibleOutletIds(user);
  return allowedOutletIds === null || allowedOutletIds.includes(String(outletId));
};

const normalizeKey = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const getAppData = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const key = normalizeKey(req.params.key);
  const outletId = typeof (req.query as any)?.outletId === 'string'
    ? String((req.query as any).outletId)
    : (user.outletId ? String(user.outletId) : '');

  if (!key) {
    res.status(400).json({ message: 'key is required' });
    return;
  }
  if (!outletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (!(await canAccessOutlet(user, outletId))) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const record = await prisma.outletAppData.findUnique({
    where: { outletId_key: { outletId, key } },
  });

  res.json({
    key,
    outletId,
    data: record?.data ?? null,
    updatedAt: record?.updatedAt ?? null,
  });
};

export const upsertAppData = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const key = normalizeKey(req.params.key);
  const outletId = typeof req.body?.outletId === 'string'
    ? String(req.body.outletId)
    : (user.outletId ? String(user.outletId) : '');
  const data = req.body?.data;

  if (!key) {
    res.status(400).json({ message: 'key is required' });
    return;
  }
  if (!outletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (data === undefined) {
    res.status(400).json({ message: 'data is required' });
    return;
  }
  if (!(await canAccessOutlet(user, outletId))) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const record = await prisma.outletAppData.upsert({
    where: { outletId_key: { outletId, key } },
    update: { data },
    create: { outletId, key, data },
  });

  res.json({
    key,
    outletId,
    data: record.data,
    updatedAt: record.updatedAt,
  });
};

export const getUserAppData = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const key = normalizeKey(req.params.key);
  if (!key) {
    res.status(400).json({ message: 'key is required' });
    return;
  }

  const record = await prisma.userAppData.findUnique({
    where: { userId_key: { userId: user.id, key } },
  });

  res.json({
    key,
    userId: user.id,
    data: record?.data ?? null,
    updatedAt: record?.updatedAt ?? null,
  });
};

export const upsertUserAppData = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const key = normalizeKey(req.params.key);
  const data = req.body?.data;

  if (!key) {
    res.status(400).json({ message: 'key is required' });
    return;
  }
  if (data === undefined) {
    res.status(400).json({ message: 'data is required' });
    return;
  }

  const record = await prisma.userAppData.upsert({
    where: { userId_key: { userId: user.id, key } },
    update: { data },
    create: { userId: user.id, key, data },
  });

  res.json({
    key,
    userId: user.id,
    data: record.data,
    updatedAt: record.updatedAt,
  });
};

export const getGlobalAppData = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.isSuperAdmin) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const key = normalizeKey(req.params.key);
  if (!key) {
    res.status(400).json({ message: 'key is required' });
    return;
  }

  const record = await prisma.globalAppData.findUnique({
    where: { key },
  });

  res.json({
    key,
    data: record?.data ?? null,
    updatedAt: record?.updatedAt ?? null,
  });
};

export const upsertGlobalAppData = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user || !user.isSuperAdmin) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const key = normalizeKey(req.params.key);
  const data = req.body?.data;

  if (!key) {
    res.status(400).json({ message: 'key is required' });
    return;
  }
  if (data === undefined) {
    res.status(400).json({ message: 'data is required' });
    return;
  }

  const record = await prisma.globalAppData.upsert({
    where: { key },
    update: { data },
    create: { key, data },
  });

  res.json({
    key,
    data: record.data,
    updatedAt: record.updatedAt,
  });
};
