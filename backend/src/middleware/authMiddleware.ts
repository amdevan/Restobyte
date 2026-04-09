import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    roleId: string | null;
    outletId: string | null;
    isSuperAdmin: boolean;
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
      select: {
        id: true,
        username: true,
        roleId: true,
        outletId: true,
        isSuperAdmin: true,
        tenantId: true
      }
    });

    if (!user) {
      res.status(401).json({ message: 'Token is not valid' });
      return;
    }

    (req as AuthRequest).user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
