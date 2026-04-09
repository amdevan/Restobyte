export type PlanName = 'Basic' | 'Pro';
export type FeatureName = 'customers' | 'inventory' | 'reports';

export const PLAN_FEATURES: Record<PlanName, { features: FeatureName[]; limits: { maxTables: number } }> = {
  Basic: { features: ['reports'], limits: { maxTables: 10 } },
  Pro: { features: ['customers', 'inventory', 'reports'], limits: { maxTables: 100 } },
};

export function hasFeature(plan: PlanName | string | null | undefined, feature: FeatureName): boolean {
  const p = (plan ?? 'Basic') as PlanName;
  const cfg = PLAN_FEATURES[p] || PLAN_FEATURES.Basic;
  return cfg.features.includes(feature);
}

export function getLimits(plan: PlanName | string | null | undefined) {
  const p = (plan ?? 'Basic') as PlanName;
  return (PLAN_FEATURES[p] || PLAN_FEATURES.Basic).limits;
}
