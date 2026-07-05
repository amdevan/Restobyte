import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const SYSTEM_ROLES = [
  { id: 'role-admin', name: 'Admin', permissions: ['*'] },
  { id: 'role-cashier', name: 'Cashier', permissions: ['pos', 'sales_history'] },
  { id: 'role-customer', name: 'Customer', permissions: ['customer_portal'] },
  { id: 'role-superadmin', name: 'Super Admin', permissions: ['*'] },
] as const;

export const isAdminLike = (user: AuthRequest['user'] | undefined) => {
  if (!user) return false;
  return user.isSuperAdmin || user.roleId === 'role-admin';
};

export const resolveTenantIdForActor = async (
  user: NonNullable<AuthRequest['user']>,
  requestedTenantId?: string | null,
  fallbackOutletId?: string | null
) => {
  if (!user.isSuperAdmin) return user.tenantId ?? null;

  if (requestedTenantId && requestedTenantId.trim()) return requestedTenantId.trim();

  if (fallbackOutletId && fallbackOutletId.trim()) {
    const outlet = await prisma.outlet.findUnique({ where: { id: fallbackOutletId.trim() }, select: { tenantId: true } });
    return outlet?.tenantId ?? null;
  }

  return user.tenantId ?? null;
};

export const ensureRoleExistsForTenant = async (roleId: string, tenantId?: string | null) => {
  return prisma.role.findFirst({
    where: {
      id: roleId,
      OR: [
        { isSystem: true },
        ...(tenantId ? [{ tenantId }] : []),
      ],
    },
  });
};

export const ensureSystemRoles = async () => {
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {
        name: role.name,
        permissions: role.permissions,
        isSystem: true,
        tenantId: null,
      },
      create: {
        id: role.id,
        name: role.name,
        permissions: role.permissions,
        isSystem: true,
        tenantId: null,
      },
    });
  }
};
