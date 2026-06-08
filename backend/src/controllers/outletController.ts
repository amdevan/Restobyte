import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

function isAdmin(user: AuthRequest['user'] | undefined) {
  if (!user) return false;
  return user.isSuperAdmin || user.roleId === 'role-admin';
}

function normalizeTaxes(input: any): any[] | null {
  if (input === undefined) return null;
  if (!Array.isArray(input)) return null;
  const normalized = input.map(t => ({
    id: typeof t?.id === 'string' ? t.id : undefined,
    name: typeof t?.name === 'string' ? t.name.trim() : '',
    rate: typeof t?.rate === 'number' ? t.rate : Number(t?.rate),
  }));
  if (normalized.some(t => !t.name || !Number.isFinite(t.rate) || t.rate < 0)) return null;
  return normalized;
}

export const listOutlets = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  if (user.isSuperAdmin) {
    const tenantId =
      typeof (req.query as any)?.tenantId === 'string'
        ? String((req.query as any).tenantId)
        : (user.tenantId ? String(user.tenantId) : undefined);
    if (!tenantId) {
      res.json([]);
      return;
    }
    const outlets = await prisma.outlet.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(outlets);
    return;
  }

  if (!user.tenantId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  if (user.roleId !== 'role-admin') {
    const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
      ? (user as any).outletIds.map(String)
      : (user.outletId ? [String(user.outletId)] : []);
    const outlets = await prisma.outlet.findMany({
      where: { tenantId: user.tenantId, ...(allowedOutletIds.length > 0 ? { id: { in: allowedOutletIds } } : {}) },
      orderBy: { createdAt: 'asc' },
    });
    res.json(outlets);
    return;
  }

  const outlets = await prisma.outlet.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(outlets);
};

export const createOutlet = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  if (!isAdmin(user)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const {
    name,
    restaurantName,
    outletType,
    address,
    phone,
    email,
    logoUrl,
    taxes,
    whatsappNumber,
    whatsappOrderingEnabled,
    whatsappDefaultMessage,
    fonepayIsEnabled,
    fonepayMerchantCode,
    fonepayTerminalId,
    fonepayCurrency,
    plan,
    subscriptionStatus,
    planExpiryDate,
    tenantId: bodyTenantId,
  } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    res.status(400).json({ message: 'Outlet name is required' });
    return;
  }

  const trimmedRestaurantName = typeof restaurantName === 'string' ? restaurantName.trim() : '';
  const normalizedOutletType = outletType === 'CloudKitchen' ? 'CloudKitchen' : 'Restaurant';
  const normalizedTaxes = normalizeTaxes(taxes);
  if (taxes !== undefined && normalizedTaxes === null) {
    res.status(400).json({ message: 'Invalid taxes' });
    return;
  }

  let tenantId: string | null = null;
  if (user.isSuperAdmin) {
    if (typeof bodyTenantId === 'string' && bodyTenantId.trim()) {
      tenantId = bodyTenantId.trim();
    } else if (user.tenantId) {
      tenantId = String(user.tenantId);
    } else {
      res.status(400).json({ message: 'tenantId is required' });
      return;
    }
  } else {
    tenantId = user.tenantId;
  }

  if (!tenantId) {
    res.status(400).json({ message: 'tenantId is required' });
    return;
  }

  const outlet = await prisma.outlet.create({
    data: {
      name: trimmedName,
      restaurantName: trimmedRestaurantName ? trimmedRestaurantName : trimmedName,
      outletType: normalizedOutletType,
      tenantId,
      address: typeof address === 'string' && address.trim() ? address.trim() : null,
      phone: typeof phone === 'string' && phone.trim() ? phone.trim() : null,
      email: typeof email === 'string' && email.trim() ? email.trim() : null,
      logoUrl: typeof logoUrl === 'string' && logoUrl.trim() ? logoUrl.trim() : null,
      taxes: normalizedTaxes ?? undefined,
      whatsappNumber: typeof whatsappNumber === 'string' && whatsappNumber.trim() ? whatsappNumber.trim() : null,
      whatsappOrderingEnabled: typeof whatsappOrderingEnabled === 'boolean' ? whatsappOrderingEnabled : false,
      whatsappDefaultMessage: typeof whatsappDefaultMessage === 'string' && whatsappDefaultMessage.trim() ? whatsappDefaultMessage.trim() : null,
      fonepayIsEnabled: typeof fonepayIsEnabled === 'boolean' ? fonepayIsEnabled : false,
      fonepayMerchantCode: typeof fonepayMerchantCode === 'string' && fonepayMerchantCode.trim() ? fonepayMerchantCode.trim() : null,
      fonepayTerminalId: typeof fonepayTerminalId === 'string' && fonepayTerminalId.trim() ? fonepayTerminalId.trim() : null,
      fonepayCurrency: typeof fonepayCurrency === 'string' && fonepayCurrency.trim() ? fonepayCurrency.trim() : null,
      plan: typeof plan === 'string' && plan.trim() ? plan.trim() : null,
      subscriptionStatus: typeof subscriptionStatus === 'string' && subscriptionStatus.trim() ? subscriptionStatus.trim() : null,
      planExpiryDate: planExpiryDate ? new Date(planExpiryDate) : null,
    } as any,
  });
  res.status(201).json(outlet);
};

export const updateOutlet = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  if (!isAdmin(user)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const id = String(req.params.id);
  const outlet = await prisma.outlet.findUnique({ where: { id } });
  if (!outlet) {
    res.status(404).json({ message: 'Outlet not found' });
    return;
  }

  if (!user.isSuperAdmin) {
    if (!user.tenantId || outlet.tenantId !== user.tenantId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
  }

  const {
    name,
    restaurantName,
    outletType,
    address,
    phone,
    email,
    logoUrl,
    taxes,
    whatsappNumber,
    whatsappOrderingEnabled,
    whatsappDefaultMessage,
    fonepayIsEnabled,
    fonepayMerchantCode,
    fonepayTerminalId,
    fonepayCurrency,
    plan,
    subscriptionStatus,
    planExpiryDate,
  } = req.body || {};
  const data: any = {};
  if (typeof name === 'string') {
    const trimmed = name.trim();
    if (!trimmed) {
      res.status(400).json({ message: 'Outlet name cannot be empty' });
      return;
    }
    data.name = trimmed;
  }
  if (typeof restaurantName === 'string') {
    const trimmed = restaurantName.trim();
    data.restaurantName = trimmed ? trimmed : null;
  }
  if (outletType !== undefined) {
    data.outletType = outletType === 'CloudKitchen' ? 'CloudKitchen' : 'Restaurant';
  }
  if (typeof address === 'string') data.address = address.trim() ? address.trim() : null;
  if (typeof phone === 'string') data.phone = phone.trim() ? phone.trim() : null;
  if (typeof email === 'string') data.email = email.trim() ? email.trim() : null;
  if (typeof logoUrl === 'string') data.logoUrl = logoUrl.trim() ? logoUrl.trim() : null;
  if (taxes !== undefined) {
    const normalizedTaxes = normalizeTaxes(taxes);
    if (normalizedTaxes === null) {
      res.status(400).json({ message: 'Invalid taxes' });
      return;
    }
    data.taxes = normalizedTaxes;
  }
  if (typeof whatsappNumber === 'string') data.whatsappNumber = whatsappNumber.trim() ? whatsappNumber.trim() : null;
  if (typeof whatsappOrderingEnabled === 'boolean') data.whatsappOrderingEnabled = whatsappOrderingEnabled;
  if (typeof whatsappDefaultMessage === 'string') data.whatsappDefaultMessage = whatsappDefaultMessage.trim() ? whatsappDefaultMessage.trim() : null;
  if (typeof fonepayIsEnabled === 'boolean') data.fonepayIsEnabled = fonepayIsEnabled;
  if (typeof fonepayMerchantCode === 'string') data.fonepayMerchantCode = fonepayMerchantCode.trim() ? fonepayMerchantCode.trim() : null;
  if (typeof fonepayTerminalId === 'string') data.fonepayTerminalId = fonepayTerminalId.trim() ? fonepayTerminalId.trim() : null;
  if (typeof fonepayCurrency === 'string') data.fonepayCurrency = fonepayCurrency.trim() ? fonepayCurrency.trim() : null;
  if (typeof plan === 'string') data.plan = plan.trim() ? plan.trim() : null;
  if (typeof subscriptionStatus === 'string') data.subscriptionStatus = subscriptionStatus.trim() ? subscriptionStatus.trim() : null;
  if (planExpiryDate !== undefined) data.planExpiryDate = planExpiryDate ? new Date(planExpiryDate) : null;

  const updated = await prisma.outlet.update({
    where: { id },
    data,
  });
  res.json(updated);
};

export const deleteOutlet = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  if (!isAdmin(user)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const id = String(req.params.id);
  const outlet = await prisma.outlet.findUnique({ where: { id } });
  if (!outlet) {
    res.status(404).json({ message: 'Outlet not found' });
    return;
  }

  if (!user.isSuperAdmin) {
    if (!user.tenantId || outlet.tenantId !== user.tenantId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
  }

  const outletsInTenant = await prisma.outlet.count({ where: { tenantId: outlet.tenantId } });
  if (outletsInTenant <= 1) {
    res.status(400).json({ message: 'You cannot delete the last remaining outlet.' });
    return;
  }

  const usersOnOutlet = await prisma.user.count({
    where: {
      OR: [
        { outletId: outlet.id },
        { outletIds: { has: outlet.id } },
      ],
    },
  } as any);
  if (usersOnOutlet > 0) {
    res.status(400).json({ message: 'Cannot delete outlet with users assigned. Reassign users first.' });
    return;
  }

  try {
    await prisma.outlet.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete outlet' });
  }
};
