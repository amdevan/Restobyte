export type FeatureKey =
  | 'pos'
  | 'kds'
  | 'customerDisplay'
  | 'menu'
  | 'tables'
  | 'reservations'
  | 'whatsapp'
  | 'inventory'
  | 'customers'
  | 'purchase'
  | 'reports'
  | 'website'
  | 'selfOrder'
  | 'subscription';

export type PlanLimits = {
  maxTables: number;
};

export type PlanConfigShape = {
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  featureKeys: FeatureKey[];
  trialDays: number;
  limits: PlanLimits;
  isPublic: boolean;
  isActive: boolean;
  isFeatured: boolean;
};

const DEFAULT_LIMITS: PlanLimits = {
  maxTables: 25,
};

export const DEFAULT_PLAN_DEFINITIONS: PlanConfigShape[] = [
  {
    name: 'Basic',
    price: 2999,
    period: 'yearly',
    features: ['POS Billing', 'Food Menu', 'Customer Management', 'Basic Reports', 'Website Menu'],
    featureKeys: ['pos', 'menu', 'customers', 'reports', 'website', 'subscription'],
    trialDays: 14,
    limits: { maxTables: 25 },
    isPublic: true,
    isActive: true,
    isFeatured: false,
  },
  {
    name: 'Pro',
    price: 5999,
    period: 'yearly',
    features: ['Everything in Basic', 'Kitchen Display', 'Tables', 'Reservations', 'Inventory', 'WhatsApp', 'Self Order'],
    featureKeys: ['pos', 'kds', 'customerDisplay', 'menu', 'tables', 'reservations', 'inventory', 'customers', 'purchase', 'reports', 'website', 'whatsapp', 'selfOrder', 'subscription'],
    trialDays: 30,
    limits: { maxTables: 100 },
    isPublic: true,
    isActive: true,
    isFeatured: true,
  },
];

export function normalizeFeatureKeys(input: unknown): FeatureKey[] {
  if (!Array.isArray(input)) return [];
  const values = input.filter((value): value is FeatureKey => typeof value === 'string' && value.trim().length > 0);
  return Array.from(new Set(values));
}

export function normalizeFeatureLabels(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function normalizeLimits(input: unknown): PlanLimits {
  const maxTablesRaw = typeof (input as any)?.maxTables === 'number'
    ? (input as any).maxTables
    : Number((input as any)?.maxTables);
  const maxTables = Number.isFinite(maxTablesRaw) && maxTablesRaw > 0 ? Math.floor(maxTablesRaw) : DEFAULT_LIMITS.maxTables;
  return { maxTables };
}

export function resolvePlanConfig(rawPlan: any): PlanConfigShape {
  const fallback = (DEFAULT_PLAN_DEFINITIONS.find((item) => item.name === rawPlan?.name)
    || DEFAULT_PLAN_DEFINITIONS.find((item) => item.name === 'Basic')
    || DEFAULT_PLAN_DEFINITIONS[0]) as PlanConfigShape;

  const period = rawPlan?.period === 'monthly' ? 'monthly' : 'yearly';
  return {
    name: typeof rawPlan?.name === 'string' && rawPlan.name.trim() ? rawPlan.name.trim() : fallback.name,
    price: Number.isFinite(Number(rawPlan?.price)) ? Number(rawPlan.price) : fallback.price,
    period,
    features: normalizeFeatureLabels(rawPlan?.features).length > 0 ? normalizeFeatureLabels(rawPlan?.features) : fallback.features,
    featureKeys: normalizeFeatureKeys(rawPlan?.featureKeys).length > 0 ? normalizeFeatureKeys(rawPlan?.featureKeys) : fallback.featureKeys,
    trialDays: Number.isFinite(Number(rawPlan?.trialDays)) && Number(rawPlan?.trialDays) >= 0 ? Math.floor(Number(rawPlan.trialDays)) : fallback.trialDays,
    limits: normalizeLimits(rawPlan?.limits),
    isPublic: typeof rawPlan?.isPublic === 'boolean' ? rawPlan.isPublic : fallback.isPublic,
    isActive: typeof rawPlan?.isActive === 'boolean' ? rawPlan.isActive : fallback.isActive,
    isFeatured: typeof rawPlan?.isFeatured === 'boolean' ? rawPlan.isFeatured : fallback.isFeatured,
  };
}
