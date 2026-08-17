import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import type { Request, Response, NextFunction } from 'express';

export const PERMISSIONS = [
  // Dashboard
  'dashboard.view',
  // POS
  'pos.view',
  'pos.create',
  'pos.edit',
  'pos.delete',
  'pos.discount',
  'pos.return',
  // Sales
  'sales.view',
  'sales.edit',
  'sales.delete',
  'sales.return',
  'sales.export',
  // KDS
  'kds.view',
  'kds.edit',
  // Menu
  'menu.view',
  'menu.create',
  'menu.edit',
  'menu.delete',
  // Tables
  'tables.view',
  'tables.create',
  'tables.edit',
  'tables.delete',
  // Reservations
  'reservations.view',
  'reservations.create',
  'reservations.edit',
  'reservations.delete',
  // Customers
  'customers.view',
  'customers.create',
  'customers.edit',
  'customers.delete',
  // Inventory
  'inventory.view',
  'inventory.create',
  'inventory.edit',
  'inventory.delete',
  // Purchase
  'purchase.view',
  'purchase.create',
  'purchase.edit',
  'purchase.delete',
  // Reports
  'reports.view',
  'reports.export',
  // Users
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  // Settings
  'settings.view',
  'settings.edit',
  // Accounting
  'accounting.view',
  'accounting.manage',
  // Invoice
  'invoice.view',
  'invoice.create',
  'invoice.edit',
  'invoice.delete',
  'invoice.print',
  // Orders
  'orders.view',
  'orders.edit',
  // Kitchen
  'kitchen.view',
  'kitchen.display',
  // Resource-level shortcuts (legacy: 'pos' matches 'pos.*')
  'dashboard',
  'pos',
  'sales',
  'kds',
  'menu',
  'tables',
  'reservations',
  'customers',
  'inventory',
  'purchase',
  'reports',
  'users',
  'settings',
  'accounting',
  'invoice',
  'orders',
  'kitchen',
  // Legacy granular permissions for backward compatibility
  'pos.create_order',
  'pos.edit_order',
  'pos.cancel_order',
  'pos.refund',
  'customer.view',
  'customer.edit',
  'customer.delete',
  'customer_portal',
  'inventory.add_product',
  'inventory.edit_product',
  'inventory.stock_adjustment',
  'inventory.view_reports',
  'roles.view',
  'roles.create',
  'roles.edit',
  'roles.delete',
] as const;

export type Permission = typeof PERMISSIONS[number];

export const SYSTEM_ROLES = [
  { id: 'role-admin', name: 'Admin', permissions: ['*'] },
  { id: 'role-superadmin', name: 'Super Admin', permissions: ['*'] },
  { id: 'role-cashier', name: 'Cashier', permissions: [
    'dashboard.view', 'pos', 'orders.view', 'customers.view', 'customers.create',
    'invoice.view', 'invoice.print', 'reports.view', 'sales.view',
    // Legacy compat
    'pos.create_order', 'pos.edit_order', 'pos.cancel_order', 'pos.discount',
    'customer.view', 'inventory.view_reports',
  ]},
  { id: 'role-waiter', name: 'Waiter', permissions: [
    'dashboard.view', 'pos', 'orders.view', 'tables.view', 'reservations.view', 'customers.view',
    'sales.view', 'menu.view',
    // Legacy compat
    'pos.create_order',
  ]},
  { id: 'role-kitchen', name: 'Kitchen Staff', permissions: [
    'dashboard.view', 'kitchen', 'orders.view', 'menu.view', 'inventory.view',
    // Legacy compat
    'kitchen.display',
  ]},
  { id: 'role-accountant', name: 'Accountant', permissions: [
    'dashboard.view', 'accounting', 'invoice.view', 'invoice.print', 'invoice.create', 'invoice.edit',
    'customers.view', 'customers.create', 'reports.view', 'reports.export',
    'purchase.view', 'purchase.edit',
    // Legacy compat
    'accounting.view_reports', 'accounting.manage_payments', 'customer.view',
  ]},
  { id: 'role-inventory-manager', name: 'Inventory Manager', permissions: [
    'dashboard.view', 'inventory', 'purchase.view', 'purchase.create', 'purchase.edit',
    'reports.view', 'reports.export',
    // Legacy compat
    'inventory.add_product', 'inventory.edit_product', 'inventory.stock_adjustment', 'inventory.view_reports',
  ]},
  { id: 'role-customer', name: 'Customer', permissions: ['customer_portal'] },
] as const;

export const isAdminLike = (user: AuthRequest['user'] | undefined) => {
  if (!user) return false;
  return user.isSuperAdmin || user.roleId === 'role-admin' || user.roleId === 'role-superadmin';
};

export const hasPermission = async (user: AuthRequest['user'] | undefined, permission: Permission) => {
  if (!user) return false;
  if (user.isSuperAdmin || user.roleId === 'role-admin' || user.roleId === 'role-superadmin') return true;
  const roleId: string = user.roleId ?? '';
  if (!roleId) return false;

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return false;

  const perms = (role.permissions as string[]) || [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;

  // Check resource-level permission (e.g. 'pos.view' matches resource 'pos')
  const resource = permission.split('.')[0] ?? '';
  if (perms.includes(resource)) return true;

  return false;
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

/** Middleware factory: rejects with 403 if the authenticated user lacks the given permission. */
export const requirePermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as AuthRequest).user;
    if (!user) {
      console.warn(`[auth] requirePermission(${permission}): No user on request`);
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const allowed = await hasPermission(user, permission);
    console.warn(`[auth] requirePermission(${permission}): user=${user.username}, isSuperAdmin=${user.isSuperAdmin}, roleId=${user.roleId}, allowed=${allowed}`);
    if (!allowed) {
      res.status(403).json({ message: 'Insufficient permissions', required: permission });
      return;
    }
    next();
  };
};
