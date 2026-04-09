import type { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from './authMiddleware.js';
import { hasFeature, getLimits } from '../utils/planConfig.js';

export function requireFeature(feature: 'customers' | 'inventory' | 'reports') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = req as AuthRequest;
    const tenantId = auth.user?.tenantId;
    if (!tenantId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const plan = tenant?.plan || 'Basic';
    if (!hasFeature(plan, feature)) {
      res.status(403).json({ message: 'Feature not available for current plan' });
      return;
    }
    next();
  };
}

export async function ensureTableLimit(req: Request, res: Response, next: NextFunction) {
  const auth = req as AuthRequest;
  const outletId = auth.user?.outletId;
  const tenantId = auth.user?.tenantId;
  if (!outletId || !tenantId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const limits = getLimits(tenant?.plan || 'Basic');
  const count = await prisma.table.count({ where: { outletId } });
  if (count >= limits.maxTables) {
    res.status(403).json({ message: `Table limit reached (${limits.maxTables}) for current plan` });
    return;
  }
  next();
}
