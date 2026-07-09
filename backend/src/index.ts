import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import prisma from './db/prisma.js';

import helloRoutes from './routes/helloRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import menuItemRoutes from './routes/menuItemRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import fonepayRoutes from './routes/fonepayRoutes.js';
import authRoutes from './routes/authRoutes.js';
import currencyRoutes from './routes/currencyRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import meRoutes from './routes/meRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import outletRoutes from './routes/outletRoutes.js';
import saasWebsiteContentRoutes from './routes/saasWebsiteContentRoutes.js';
import saasWebsiteContentAdminRoutes from './routes/saasWebsiteContentAdminRoutes.js';
import planRoutes from './routes/planRoutes.js';
import appDataRoutes from './routes/appDataRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import { DEFAULT_PLAN_DEFINITIONS } from './utils/planConfig.js';
import { ensureSystemRoles } from './utils/roleUtils.js';
import { backfillMissingInvoices } from './services/invoiceService.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('RestoByte Backend is running!');
});

app.get('/api', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', helloRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/fonepay', fonepayRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/me', meRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/public', saasWebsiteContentRoutes);
app.use('/api/saas', saasWebsiteContentAdminRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/app-data', appDataRoutes);
app.use('/api/invoices', invoiceRoutes);

async function start() {
  try {
    await prisma.$connect();
    console.log('[database]: Connected to database successfully');
  } catch (error) {
    console.error('[database]: Failed to connect to database', error);
    process.exit(1);
  }

  if (typeof process.env.RESET_SUPERADMIN_PASSWORD === 'string' && process.env.RESET_SUPERADMIN_PASSWORD.trim()) {
    const username = typeof process.env.RESET_SUPERADMIN_USERNAME === 'string' && process.env.RESET_SUPERADMIN_USERNAME.trim()
      ? process.env.RESET_SUPERADMIN_USERNAME.trim()
      : 'superadmin';
    try {
      const hashed = await bcrypt.hash(process.env.RESET_SUPERADMIN_PASSWORD, 10);
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        await prisma.user.update({
          where: { username },
          data: { password: hashed, isSuperAdmin: true, isActive: true },
        } as any);
        console.log('[bootstrap]: Updated superadmin password');
      } else {
        await prisma.user.create({
          data: { username, password: hashed, roleId: 'role-superadmin', isSuperAdmin: true, isActive: true },
        } as any);
        console.log('[bootstrap]: Created superadmin user');
      }
    } catch (error) {
      console.error('[bootstrap]: Failed to reset superadmin password', error);
    }
  }

  try {
    await ensureSystemRoles();
    console.log('[bootstrap]: Ensured system roles');
  } catch (error) {
    console.error('[bootstrap]: Failed to ensure system roles', error);
  }

  const shouldSeedDemoUsers = process.env.SEED_DEMO_USERS === 'true';
  if (shouldSeedDemoUsers) {
    try {
      const userCount = await prisma.user.count();
      if (userCount > 0) {
        console.log('[seed]: Skipping demo seed because database already has users');
      } else {
      const tenant = await prisma.tenant.upsert({
        where: { id: 'tenant-1' },
        update: {},
        create: {
          id: 'tenant-1',
          name: 'Demo Tenant',
          plan: 'Pro',
          subscriptionStatus: 'active',
        } as any,
      });

      const outlet = await prisma.outlet.upsert({
        where: { id: 'outlet-1' },
        update: { tenantId: tenant.id, slug: 'main-outlet' },
        create: {
          id: 'outlet-1',
          name: 'Main Outlet',
          slug: 'main-outlet',
          tenantId: tenant.id,
          address: '123 Main St',
          phone: '555-0123',
        },
      });

      const adminUsername = process.env.DEMO_ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'admin123';

      const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });
      if (!existingAdmin) {
        const hashed = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
          data: {
            username: adminUsername,
            password: hashed,
            roleId: 'role-admin',
            outletId: outlet.id,
            tenantId: tenant.id,
            isActive: true,
            isSuperAdmin: false,
          },
        });
        console.log('[seed]: Created demo admin user');
      }

      const superUsername = process.env.DEMO_SUPERADMIN_USERNAME || 'superadmin';
      const superPassword = process.env.DEMO_SUPERADMIN_PASSWORD || 'superadmin123';

      const existingSuper = await prisma.user.findUnique({ where: { username: superUsername } });
      if (!existingSuper) {
        const hashed = await bcrypt.hash(superPassword, 10);
        await prisma.user.create({
          data: {
            username: superUsername,
            password: hashed,
            roleId: 'role-superadmin',
            outletId: outlet.id,
            tenantId: tenant.id,
            isActive: true,
            isSuperAdmin: true,
          },
        });
        console.log('[seed]: Created demo superadmin user');
      }
      }
    } catch (error) {
      console.error('[seed]: Failed to seed demo users', error);
    }
  }

  try {
    const planCount = await prisma.planDefinition.count();
    if (planCount === 0) {
      await prisma.planDefinition.createMany({
        data: DEFAULT_PLAN_DEFINITIONS.map((plan) => ({
          name: plan.name,
          price: plan.price,
          period: plan.period,
          features: plan.features,
          featureKeys: plan.featureKeys,
          limits: plan.limits,
          trialDays: plan.trialDays,
          isPublic: plan.isPublic,
          isActive: plan.isActive,
          isFeatured: plan.isFeatured,
        })),
      } as any);
      console.log('[database]: Seeded default plan definitions');
    }
  } catch (error) {
    console.error('[database]: Failed to ensure default plans', error);
  }

  try {
    const existingCount = await prisma.currency.count();
    if (existingCount === 0) {
      await prisma.currency.create({
        data: {
          name: 'Nepalese Rupee',
          code: 'NPR',
          symbol: 'Rs',
          exchangeRate: 1,
          isDefault: true,
        },
      });
      console.log('[database]: Seeded default currency (NPR)');
    }
  } catch (error) {
    console.error('[database]: Failed to ensure default currency', error);
  }

  try {
    const createdInvoices = await backfillMissingInvoices();
    if (createdInvoices > 0) {
      console.log(`[database]: Backfilled ${createdInvoices} subscription invoices`);
    }
  } catch (error) {
    console.error('[database]: Failed to backfill subscription invoices', error);
  }

  app.listen(port, host, () => {
    console.log(`[server]: Server is running at http://${host}:${port}`);
  });
}

start();
