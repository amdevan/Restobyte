import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import { resolvePlanConfig, normalizeFeatureKeys, normalizeFeatureLabels, normalizeLimits } from '../utils/planConfig.js';

function formatPlan(plan: any) {
  const normalized = resolvePlanConfig(plan);
  return {
    id: plan.id,
    ...normalized,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export const listPlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.planDefinition.findMany({
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ plans: plans.map(formatPlan) });
  } catch (error) {
    console.error('listPlans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPlan = async (req: Request, res: Response): Promise<void> => {
  const normalized = resolvePlanConfig(req.body || {});
  try {
    const created = await prisma.planDefinition.create({
      data: {
        name: normalized.name,
        price: normalized.price,
        period: normalized.period,
        features: normalized.features,
        featureKeys: normalized.featureKeys,
        limits: normalized.limits,
        trialDays: normalized.trialDays,
        isPublic: normalized.isPublic,
        isActive: normalized.isActive,
        isFeatured: normalized.isFeatured,
      } as any,
    });
    res.status(201).json(formatPlan(created));
  } catch (error) {
    console.error('createPlan error:', error);
    res.status(400).json({ message: 'Failed to create plan', error: String(error) });
  }
};

export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const body = req.body || {};
  try {
    const existing = await prisma.planDefinition.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Plan not found' });
      return;
    }

    const updated = await prisma.planDefinition.update({
      where: { id },
      data: {
        name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name,
        price: Number.isFinite(Number(body.price)) ? Number(body.price) : existing.price,
        period: body.period === 'yearly' ? 'yearly' : (body.period === 'monthly' ? 'monthly' : existing.period),
        features: body.features !== undefined ? normalizeFeatureLabels(body.features) : existing.features,
        featureKeys: body.featureKeys !== undefined ? normalizeFeatureKeys(body.featureKeys) : existing.featureKeys,
        limits: body.limits !== undefined ? normalizeLimits(body.limits) : existing.limits,
        trialDays: Number.isFinite(Number(body.trialDays)) && Number(body.trialDays) >= 0 ? Math.floor(Number(body.trialDays)) : existing.trialDays,
        isPublic: typeof body.isPublic === 'boolean' ? body.isPublic : existing.isPublic,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,
        isFeatured: typeof body.isFeatured === 'boolean' ? body.isFeatured : existing.isFeatured,
      } as any,
    });
    res.json(formatPlan(updated));
  } catch (error) {
    console.error('updatePlan error:', error);
    res.status(400).json({ message: 'Failed to update plan', error: String(error) });
  }
};

export const deletePlan = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const existing = await prisma.planDefinition.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Plan not found' });
      return;
    }

    const tenantsUsingPlan = await prisma.tenant.count({ where: { plan: existing.name } });
    if (tenantsUsingPlan > 0) {
      res.status(400).json({ message: 'Cannot delete a plan that is assigned to tenants' });
      return;
    }

    await prisma.planDefinition.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('deletePlan error:', error);
    res.status(400).json({ message: 'Failed to delete plan', error: String(error) });
  }
};
