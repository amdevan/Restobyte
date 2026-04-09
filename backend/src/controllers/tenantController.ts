import type { Request, Response } from 'express';
import prisma from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../services/emailService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const createTenant = async (req: Request, res: Response): Promise<void> => {
  const { restaurantName, fullName, mobile, address, username, password, countryCode, currencyCode, adminEmail } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(400).json({ message: 'Username already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Perform all operations in a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: restaurantName,
          address,
          phone: mobile,
          // Cast to any to avoid transient client type mismatches during codegen
          ...( { countryCode: countryCode || null, currencyCode: currencyCode || null } as any ),
          subscriptionStatus: 'trialing',
          plan: 'Basic',
        },
      });

      // 2. Create Outlet
      const outlet = await tx.outlet.create({
        data: {
          name: restaurantName,
          tenantId: tenant.id,
          address,
          phone: mobile,
        },
      });

      // 3. Create Admin User
      const user = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          roleId: 'role-admin', // Default role for tenant admin
          outletId: outlet.id,
          tenantId: tenant.id,
          isActive: true,
          isSuperAdmin: false,
        },
      });

      // 4. Seed Default Data for the Fresh Restaurant System
      
      // Seed Categories
      const categories = await Promise.all([
        tx.category.create({ data: { name: 'Food', outletId: outlet.id } }),
        tx.category.create({ data: { name: 'Drinks', outletId: outlet.id } }),
        tx.category.create({ data: { name: 'Desserts', outletId: outlet.id } }),
      ]);

      // Seed Menu Items
      await tx.menuItem.createMany({
        data: [
          {
            name: 'Classic Burger',
            description: 'Juicy beef patty with lettuce, tomato, and cheese.',
            price: 9.99,
            categoryId: categories[0].id,
            isVegetarian: false,
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60',
          },
          {
            name: 'Margherita Pizza',
            description: 'Classic tomato and mozzarella pizza.',
            price: 12.50,
            categoryId: categories[0].id,
            isVegetarian: true,
            imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60',
          },
          {
            name: 'Coca Cola',
            description: 'Chilled soft drink.',
            price: 2.50,
            categoryId: categories[1].id,
            isVegetarian: true,
            imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTN8fGNvY2ElMjBjb2xhfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
          },
          {
            name: 'Chocolate Cake',
            description: 'Rich chocolate layer cake.',
            price: 6.00,
            categoryId: categories[2].id,
            isVegetarian: true,
            imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8Y2hvY29sYXRlJTIwY2FrZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
          },
        ],
      });

      // Seed Tables (10 tables)
      const tablesData = Array.from({ length: 10 }, (_, i) => ({
        name: `Table ${i + 1}`,
        capacity: 4,
        status: 'Free',
        outletId: outlet.id,
      }));

      await tx.table.createMany({
        data: tablesData,
      });

      // Seed Walk-in Customer
      await tx.customer.create({
        data: {
          name: 'Walk-in Customer',
          phone: 'N/A',
          outletId: outlet.id,
        },
      });

      return { tenant, outlet, user };
    });

    res.status(201).json({ 
      message: 'Tenant created with fresh system', 
      tenant: { id: result.tenant.id, name: result.tenant.name }, 
      outlet: { id: result.outlet.id, name: result.outlet.name }, 
      adminUser: { id: result.user.id, username: result.user.username } 
    });
    if (adminEmail) {
      try {
        await sendWelcomeEmail(adminEmail, fullName || restaurantName);
      } catch {}
    }

  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
};

export const listTenants = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          where: { roleId: 'role-admin' },
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to match expected frontend format
    const formattedTenants = tenants.map(t => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      plan: t.plan,
      address: t.address,
      countryCode: (t as any).countryCode ?? null,
      currencyCode: (t as any).currencyCode ?? null,
      subscriptionStatus: t.subscriptionStatus,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      adminUsername: t.users[0]?.username || 'N/A'
    }));

    res.json({ tenants: formattedTenants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTenant = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    // Delete Tenant (Cascading delete handles related data if configured in schema, 
    // otherwise we might need to delete related records manually. 
    // Assuming onDelete: Cascade in schema for Tenant -> Outlet, Tenant -> User)
    
    // For safety, let's wrap in transaction if we want to be explicit, 
    // but Prisma Cascade is preferred. Let's assume schema has Cascade.
    
    await prisma.tenant.delete({
      where: { id },
    });

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    res.status(500).json({ message: 'Server error', error: String(error) });
  }
};

export const updateTenant = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { name, plan, subscriptionStatus, username, password, countryCode, currencyCode } = req.body;
  
  try {
    const updateData: any = {
        name,
        plan,
        subscriptionStatus,
        countryCode,
        currencyCode,
    };

    // Update Tenant
    await prisma.tenant.update({
        where: { id },
        data: updateData
    });
    
    // Update Outlet (assuming one outlet per tenant for now, or updating all)
    // For simplicity, we update outlets with the same name if the tenant name changes
    if (name) {
        await prisma.outlet.updateMany({
            where: { tenantId: id },
            data: { name }
        });
    }

    // Update Admin User
    if (username || password) {
      const userData: any = {};
      if (username) {
          // Check uniqueness
          const existing = await prisma.user.findUnique({ where: { username } });
          if (existing && existing.tenantId !== id) {
              res.status(400).json({ message: 'Username already taken' });
              return;
          }
          userData.username = username;
      }
      if (password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(password, salt);
      }

      await prisma.user.updateMany({
          where: { tenantId: id, roleId: 'role-admin' },
          data: userData
      });
    }

    res.json({ message: 'Tenant updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTenantDetails = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, username: true, isActive: true, createdAt: true } },
        outlets: { select: { id: true, name: true, address: true, phone: true, createdAt: true } },
      },
    });
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found' });
      return;
    }
    const payments = await (prisma as any).payment.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      id: tenant.id,
      name: tenant.name,
      phone: tenant.phone,
      address: tenant.address,
      plan: tenant.plan,
      subscriptionStatus: tenant.subscriptionStatus,
      createdAt: tenant.createdAt,
      outlets: (tenant as any).outlets || [],
      users: (tenant as any).users || [],
      payments,
    });
  } catch (error) {
    console.error('getTenantDetails error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyTenantCurrency = async (req: Request, res: Response): Promise<void> => {
  const auth = req as AuthRequest;
  const tenantId = auth.user?.tenantId;
  if (!tenantId) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { countryCode: true, currencyCode: true } });
    res.json(tenant ?? { countryCode: null, currencyCode: null });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
