import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { ensureRoleExistsForTenant, isAdminLike, resolveTenantIdForActor } from '../utils/roleUtils.js';

const normalizePermissions = (value: unknown) => (
  Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : []
);

export const getRoles = async (req: Request, res: Response) => {
  const actor = (req as AuthRequest).user;
  if (!isAdminLike(actor)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const tenantId = await resolveTenantIdForActor(
    actor!,
    typeof req.query?.tenantId === 'string' ? req.query.tenantId : undefined
  );

  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { isSystem: true },
        ...(tenantId ? [{ tenantId }] : []),
      ],
    },
    orderBy: [
      { isSystem: 'desc' },
      { name: 'asc' },
    ],
  });

  res.json(roles.map((role) => ({
    id: String(role.id),
    name: String(role.name),
    permissions: normalizePermissions(role.permissions),
    tenantId: role.tenantId ? String(role.tenantId) : undefined,
    isSystem: Boolean(role.isSystem),
  })));
};

export const createRole = async (req: Request, res: Response) => {
  const actor = (req as AuthRequest).user;
  if (!isAdminLike(actor)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const permissions = normalizePermissions(req.body?.permissions);
  const tenantId = await resolveTenantIdForActor(
    actor!,
    typeof req.body?.tenantId === 'string' ? req.body.tenantId : undefined
  );

  if (!name) {
    res.status(400).json({ message: 'Role name is required' });
    return;
  }
  if (!tenantId) {
    res.status(400).json({ message: 'tenantId is required' });
    return;
  }

  const existing = await prisma.role.findFirst({
    where: { tenantId, name: { equals: name, mode: 'insensitive' } },
  });
  if (existing) {
    res.status(400).json({ message: 'Role name already exists' });
    return;
  }

  const role = await prisma.role.create({
    data: {
      id: `role-${crypto.randomUUID()}`,
      name,
      permissions,
      tenantId,
      isSystem: false,
    },
  });

  res.status(201).json({
    id: role.id,
    name: role.name,
    permissions: normalizePermissions(role.permissions),
    tenantId: role.tenantId ?? undefined,
    isSystem: role.isSystem,
  });
};

export const updateRole = async (req: Request, res: Response) => {
  const actor = (req as AuthRequest).user;
  if (!isAdminLike(actor)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const id = String(req.params.id);
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Role not found' });
    return;
  }
  if (existing.isSystem) {
    res.status(400).json({ message: 'System roles cannot be edited' });
    return;
  }

  const tenantId = await resolveTenantIdForActor(actor!, existing.tenantId ?? undefined);
  if (!tenantId || existing.tenantId !== tenantId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const permissions = normalizePermissions(req.body?.permissions);

  if (!name) {
    res.status(400).json({ message: 'Role name is required' });
    return;
  }

  const duplicate = await prisma.role.findFirst({
    where: {
      tenantId,
      id: { not: id },
      name: { equals: name, mode: 'insensitive' },
    },
  });
  if (duplicate) {
    res.status(400).json({ message: 'Role name already exists' });
    return;
  }

  const role = await prisma.role.update({
    where: { id },
    data: { name, permissions },
  });

  res.json({
    id: role.id,
    name: role.name,
    permissions: normalizePermissions(role.permissions),
    tenantId: role.tenantId ?? undefined,
    isSystem: role.isSystem,
  });
};

export const deleteRole = async (req: Request, res: Response) => {
  const actor = (req as AuthRequest).user;
  if (!isAdminLike(actor)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const id = String(req.params.id);
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Role not found' });
    return;
  }
  if (existing.isSystem) {
    res.status(400).json({ message: 'System roles cannot be deleted' });
    return;
  }

  const tenantId = await resolveTenantIdForActor(actor!, existing.tenantId ?? undefined);
  if (!tenantId || existing.tenantId !== tenantId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const assignedUser = await prisma.user.findFirst({
    where: {
      roleId: id,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true },
  });
  if (assignedUser) {
    res.status(400).json({ message: 'Role is assigned to users and cannot be deleted' });
    return;
  }

  await prisma.role.delete({ where: { id } });
  res.status(204).send();
};

export const validateRoleForUser = async (roleId: string, tenantId?: string | null) => {
  const role = await ensureRoleExistsForTenant(roleId, tenantId);
  return Boolean(role);
};
