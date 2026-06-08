import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, password, roleId, outletId, outletIds, isSuperAdmin, name, mobile, address } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const requestedOutletIds = Array.isArray(outletIds)
      ? outletIds.map((v: any) => String(v)).filter(Boolean)
      : (typeof outletId === 'string' && outletId ? [String(outletId)] : []);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        roleId,
        outletId: requestedOutletIds[0] || outletId,
        outletIds: requestedOutletIds,
        isSuperAdmin: isSuperAdmin || false
      }
    } as any);

    if (roleId === 'role-customer') {
      try {
        await prisma.customer.create({
          data: {
            name: name || username,
            email: username,
            phone: mobile || null,
            address: address || null,
            userId: user.id,
            outletId
          }
        });
      } catch (e) {
        console.error('Failed to create customer profile linked to user', e);
      }
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        isSuperAdmin: user.isSuperAdmin,
        roleId: user.roleId,
        outletId: user.outletId,
        outletIds: Array.isArray((user as any).outletIds) ? (user as any).outletIds : (user.outletId ? [user.outletId] : []),
        tenantId: user.tenantId,
        isActive: user.isActive
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } } as any);
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        isSuperAdmin: user.isSuperAdmin,
        roleId: user.roleId,
        outletId: user.outletId,
        outletIds: Array.isArray((user as any).outletIds) ? (user as any).outletIds : (user.outletId ? [user.outletId] : []),
        tenantId: user.tenantId,
        isActive: user.isActive
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};

export const impersonate = async (req: Request, res: Response): Promise<void> => {
  const { tenantId } = req.params as { tenantId: string };
  const authReq = req as AuthRequest;

  if (!authReq.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }

    const adminUser = await prisma.user.findFirst({
      where: { tenantId, roleId: 'role-admin', isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    if (!adminUser) {
      res.status(404).json({ message: 'Admin user not found for tenant' });
      return;
    }

    const token = jwt.sign(
      { userId: adminUser.id, username: adminUser.username, isSuperAdmin: false },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        isSuperAdmin: false,
        roleId: adminUser.roleId,
        outletId: adminUser.outletId,
        outletIds: Array.isArray((adminUser as any).outletIds) ? (adminUser as any).outletIds : (adminUser.outletId ? [adminUser.outletId] : []),
        isActive: adminUser.isActive
      },
      message: 'Impersonation successful'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};
