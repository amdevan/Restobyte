import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const listOutlets = async (req: Request, res: Response) => {
  const auth = req as AuthRequest;
  const user = auth.user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  if (user.isSuperAdmin) {
    const tenantId = typeof (req.query as any)?.tenantId === 'string' ? String((req.query as any).tenantId) : undefined;
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

  const outlets = await prisma.outlet.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(outlets);
};
