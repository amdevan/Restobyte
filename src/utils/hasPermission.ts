import { Role } from '../types';

const LEGACY_MAP: Record<string, string[]> = {
  'inventory.view': ['inventory.view_reports'],
  'inventory.create': ['inventory.add_product'],
  'inventory.edit': ['inventory.edit_product', 'inventory.stock_adjustment'],
  'purchase.view': ['invoice.view'],
  'customers.view': ['customer.view'],
  'sales.view': ['invoice.view'],
  'users.view': ['roles.view'],
  'menu.view': ['inventory.add_product', 'inventory.edit_product'],
  'pos.view': ['pos.create_order'],
  'kitchen.view': ['kitchen.display'],
  'accounting.view': ['accounting.view_reports'],
  'accounting.manage': ['accounting.manage_payments'],
};

/**
 * Check if a user has one of the required permissions.
 * Uses `user.permissions` (from login response / localStorage) as primary source.
 * Falls back to role lookup from the roles array if needed.
 */
export function hasPermission(
  requiredPermissions: string[] | undefined,
  userPermissions: string[],
  roles: Role[],
  userRoleId?: string,
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;

  // Wildcard grants all
  if (userPermissions.includes('*')) return true;

  return requiredPermissions.some(perm => {
    // Exact match
    if (userPermissions.includes(perm)) return true;
    // Resource-level shortcut (e.g., 'inventory' matches 'inventory.view')
    const resource = perm.split('.')[0];
    if (userPermissions.includes(resource)) return true;
    // Legacy permission mappings
    const legacyPerms = LEGACY_MAP[perm] || [];
    if (legacyPerms.some(lp => userPermissions.includes(lp))) return true;

    // Fallback: look up role from roles array (handles custom roles not in login response)
    if (userRoleId) {
      const role = roles.find(r => r.id === userRoleId);
      if (role) {
        const rolePerms = role.permissions || [];
        if (rolePerms.includes('*')) return true;
        if ((rolePerms as string[]).includes(perm)) return true;
        if ((rolePerms as string[]).includes(resource)) return true;
        if ((role.granularPermissions as string[] | undefined)?.includes(perm)) return true;
        if (legacyPerms.some(lp => rolePerms.includes(lp))) return true;
      }
    }

    return false;
  });
}

/**
 * Check a single permission against a user's permissions.
 */
export function hasSinglePermission(
  permission: string,
  userPermissions: string[],
  roles: Role[],
  userRoleId?: string,
): boolean {
  return hasPermission([permission], userPermissions, roles, userRoleId);
}
