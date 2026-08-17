import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string | null;
    phone: string | null;
    roleId: string | null;
    outletId: string | null;
    outletIds?: string[];
    isSuperAdmin: boolean;
    isActive: boolean;
    tenantId: string | null;
  };
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: ({
        id: true,
        username: true,
        email: true,
        phone: true,
        roleId: true,
        outletId: true,
        outletIds: true,
        isSuperAdmin: true,
        isActive: true,
        tenantId: true
      } as any)
    });

    if (!user) {
      res.status(401).json({ message: 'Token is not valid' });
      return;
    }

    (req as AuthRequest).user = {
      ...(user as any),
      outletIds: Array.isArray((user as any)?.outletIds) ? (user as any).outletIds : [],
    };
    console.warn(`[auth] User authenticated: ${user.username} (role=${user.roleId}, superAdmin=${user.isSuperAdmin}, tenant=${user.tenantId})`);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
