import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { validateRoleForUser } from './roleController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

const getClientIp = (req: Request): string | null => {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    const firstIp = String(forwarded[0] ?? '').split(',')[0] ?? '';
    return firstIp.trim() || null;
  }
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const firstIp = forwarded.split(',')[0] ?? '';
    return firstIp.trim() || null;
  }
  return req.socket.remoteAddress || null;
};

const getDeviceLabel = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown Device';
  const ua = userAgent.toLowerCase();

  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('android')) return 'Android Device';
  if (ua.includes('windows')) return 'Windows PC';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac';
  if (ua.includes('linux')) return 'Linux Device';

  return 'Web Browser';
};

const recordTenantLogin = async (req: Request, user: any, loginType = 'password'): Promise<void> => {
  if (!user?.tenantId) return;

  const userAgent = req.get('user-agent') || null;
  try {
    await (prisma as any).tenantLoginHistory.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        username: user.username,
        ipAddress: getClientIp(req),
        userAgent,
        deviceLabel: getDeviceLabel(userAgent),
        loginType,
      },
    });
  } catch (error) {
    console.error('Failed to record tenant login history', error);
  }
};

const normalizePermissions = (value: unknown) => (
  Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : []
);

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const role = await prisma.role.findUnique({
    where: { id: user.roleId || '' },
  });

  res.json({
    id: user.id,
    username: user.username,
    email: (user as any).email,
    phone: (user as any).phone,
    isSuperAdmin: user.isSuperAdmin,
    roleId: user.roleId,
    roleName: role?.name,
    permissions: normalizePermissions(role?.permissions),
    outletId: user.outletId,
    outletIds: Array.isArray((user as any).outletIds) ? (user as any).outletIds : (user.outletId ? [user.outletId] : []),
    tenantId: user.tenantId,
    isActive: user.isActive,
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, phone, password, roleId, outletId, outletIds, isSuperAdmin, name, mobile, address } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        res.status(400).json({ message: 'Email already exists' });
        return;
      }
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        res.status(400).json({ message: 'Phone already exists' });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const requestedOutletIds = Array.isArray(outletIds)
      ? outletIds.map((v: any) => String(v)).filter(Boolean)
      : (typeof outletId === 'string' && outletId ? [String(outletId)] : []);

    const resolvedRoleId = typeof roleId === 'string' && roleId.trim() ? roleId.trim() : '';
    if (!resolvedRoleId || !(await validateRoleForUser(resolvedRoleId, null))) {
      res.status(400).json({ message: 'A valid role is required' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        username,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        roleId: resolvedRoleId,
        outletId: requestedOutletIds[0] || outletId,
        outletIds: requestedOutletIds,
        isSuperAdmin: isSuperAdmin || false
      }
    } as any);

    if (resolvedRoleId === 'role-customer') {
      try {
        await prisma.customer.create({
          data: {
            name: name || username,
            email: email || username,
            phone: phone || mobile || null,
            address: address || null,
            userId: user.id,
            outletId
          }
        });
      } catch (e) {
        console.error('Failed to create customer profile linked to user', e);
      }
    }

    const role = await prisma.role.findUnique({ where: { id: resolvedRoleId } });

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
        email: (user as any).email,
        phone: (user as any).phone,
        isSuperAdmin: user.isSuperAdmin,
        roleId: user.roleId,
        roleName: role?.name,
        permissions: normalizePermissions(role?.permissions),
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
  console.log('[login]: Starting login attempt for username:', username);

  try {
    // Step 1: Verify database connection
    console.log('[login]: Step 1 - Verifying Prisma DB connection...');
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[login]: Prisma DB connection verified');
    } catch (dbErr) {
      console.error('[login]: Failed to verify DB connection', dbErr);
      throw new Error('Database connection error');
    }

    // Step 2: Look up user by username
    console.log('[login]: Step 2 - Looking up user by username...');
    let user;
    try {
      user = await prisma.user.findUnique({ where: { username } });
    } catch (lookupErr) {
      console.error('[login]: Failed to look up user', lookupErr);
      throw new Error('User lookup failed');
    }

    if (!user) {
      console.log('[login]: User not found');
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }
    console.log('[login]: User found:', { id: user.id, username: user.username, hasPassword: !!user.password });

    // Step 3: Verify password
    console.log('[login]: Step 3 - Verifying password...');
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      console.error('[login]: Failed to compare passwords', bcryptErr);
      throw new Error('Password verification failed');
    }

    if (!isMatch) {
      console.log('[login]: Password mismatch');
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }
    console.log('[login]: Password verified successfully');

    // Step 4: Retrieve role
    console.log('[login]: Step 4 - Retrieving user role...');
    let role;
    try {
      role = await prisma.role.findUnique({ where: { id: user.roleId || '' } });
    } catch (roleErr) {
      console.error('[login]: Failed to retrieve role', roleErr);
      throw new Error('Role retrieval failed');
    }
    console.log('[login]: Role retrieved:', role ? { id: role.id, name: role.name } : 'no role found');

    // Step 5: Generate JWT token
    console.log('[login]: Step 5 - Generating JWT token...');
    let token;
    try {
      token = jwt.sign(
        { userId: user.id, username: user.username, isSuperAdmin: user.isSuperAdmin },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
    } catch (jwtErr) {
      console.error('[login]: Failed to generate JWT token', jwtErr);
      throw new Error('Token generation failed');
    }
    console.log('[login]: JWT token generated');

    // Step 6: Record tenant login history
    console.log('[login]: Step 6 - Recording tenant login history...');
    try {
      await recordTenantLogin(req, user, 'password');
      console.log('[login]: Tenant login history recorded');
    } catch (recordErr) {
      // This is non-critical, so we just log it and proceed
      console.error('[login]: Failed to record tenant login (non-critical)', recordErr);
    }

    // Prepare user response
    console.log('[login]: Step 7 - Preparing user response...');
    const userResponse = {
      id: user.id,
      username: user.username,
      email: (user as any).email,
      phone: (user as any).phone,
      isSuperAdmin: user.isSuperAdmin,
      roleId: user.roleId,
      roleName: role?.name,
      permissions: normalizePermissions(role?.permissions),
      outletId: user.outletId,
      outletIds: Array.isArray((user as any).outletIds) ? (user as any).outletIds : (user.outletId ? [user.outletId] : []),
      tenantId: user.tenantId,
      isActive: user.isActive
    };

    console.log('[login]: Login successful! Sending response');
    res.json({
      token,
      user: userResponse,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('[login]: Unexpected error during login process');
    console.error('[login]: Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('[login]: Error message:', error instanceof Error ? error.message : String(error));
    console.error('[login]: Stack trace:', error instanceof Error ? error.stack : 'No stack available');
    res.status(500).json({ 
      message: 'Server error', 
      error: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined 
    });
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
    } as any);

    if (!adminUser) {
      res.status(404).json({ message: 'Admin user not found for tenant' });
      return;
    }

    const role = await prisma.role.findUnique({ where: { id: adminUser.roleId || '' } });

    const token = jwt.sign(
      { userId: adminUser.id, username: adminUser.username, isSuperAdmin: false },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    await recordTenantLogin(req, adminUser, 'impersonation');

    res.json({
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        phone: adminUser.phone,
        isSuperAdmin: false,
        roleId: adminUser.roleId,
        roleName: role?.name,
        permissions: normalizePermissions(role?.permissions),
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
