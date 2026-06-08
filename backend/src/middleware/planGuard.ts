import type { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from './authMiddleware.js';
import { resolvePlanConfig, type FeatureKey } from '../utils/planConfig.js';

export function requireFeature(feature: FeatureKey) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = req as AuthRequest;
    const tenantId = auth.user?.tenantId;
    if (!tenantId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const plan = tenant?.plan || 'Basic';
    const planDefinition = await prisma.planDefinition.findUnique({ where: { name: plan } });
    const resolved = resolvePlanConfig(planDefinition || { name: plan });
    if (!resolved.featureKeys.includes(feature)) {
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
  const planDefinition = await prisma.planDefinition.findUnique({ where: { name: tenant?.plan || 'Basic' } });
  const limits = resolvePlanConfig(planDefinition || { name: tenant?.plan || 'Basic' }).limits;
  const count = await prisma.table.count({ where: { outletId } });
  if (count >= limits.maxTables) {
    res.status(403).json({ message: `Table limit reached (${limits.maxTables}) for current plan` });
    return;
  }
  next();
}
