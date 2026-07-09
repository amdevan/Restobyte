import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const PERMISSIONS = [
  // Dashboard
  'dashboard.view',
  // POS
  'pos.create_order',
  'pos.edit_order',
  'pos.cancel_order',
  'pos.discount',
  'pos.refund',
  // Invoice
  'invoice.create',
  'invoice.view',
  'invoice.edit',
  'invoice.delete',
  'invoice.print',
  // Customer
  'customer.view',
  'customer.edit',
  'customer.delete',
  // Inventory
  'inventory.add_product',
  'inventory.edit_product',
  'inventory.stock_adjustment',
  'inventory.view_reports',
  // Accounting
  'accounting.view_reports',
  'accounting.manage_payments',
  // Orders
  'orders.view',
  'orders.edit',
  // Kitchen
  'kitchen.display',
  // Settings
  'settings.view',
  'settings.edit',
  // Users
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  // Roles
  'roles.view',
  'roles.create',
  'roles.edit',
  'roles.delete',
] as const;

export type Permission = typeof PERMISSIONS[number];

export const SYSTEM_ROLES = [
  { id: 'role-admin', name: 'Admin', permissions: ['*'] },
  { id: 'role-cashier', name: 'Cashier', permissions: ['dashboard.view', 'pos.create_order', 'pos.edit_order', 'pos.cancel_order', 'pos.discount', 'invoice.view', 'invoice.print', 'customer.view', 'orders.view'] },
  { id: 'role-waiter', name: 'Waiter', permissions: ['dashboard.view', 'pos.create_order', 'orders.view'] },
  { id: 'role-kitchen', name: 'Kitchen Staff', permissions: ['kitchen.display', 'orders.view'] },
  { id: 'role-accountant', name: 'Accountant', permissions: ['dashboard.view', 'accounting.view_reports', 'accounting.manage_payments', 'invoice.view', 'invoice.print', 'customer.view'] },
  { id: 'role-inventory-manager', name: 'Inventory Manager', permissions: ['dashboard.view', 'inventory.add_product', 'inventory.edit_product', 'inventory.stock_adjustment', 'inventory.view_reports'] },
  { id: 'role-customer', name: 'Customer', permissions: ['customer_portal'] },
  { id: 'role-superadmin', name: 'Super Admin', permissions: ['*'] },
] as const;

export const isAdminLike = (user: AuthRequest['user'] | undefined) => {
  if (!user) return false;
  return user.isSuperAdmin || user.roleId === 'role-admin' || user.roleId === 'role-superadmin';
};

export const hasPermission = (user: AuthRequest['user'] | undefined, permission: Permission) => {
  if (!user) return false;
  if (user.isSuperAdmin || user.roleId === 'role-admin' || user.roleId === 'role-superadmin') return true;
  // We'll fetch user's role permissions from the role
  return true; // Placeholder for now
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
