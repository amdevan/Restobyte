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
import outletRoutes from './routes/outletRoutes.js';
import saasWebsiteContentRoutes from './routes/saasWebsiteContentRoutes.js';
import saasWebsiteContentAdminRoutes from './routes/saasWebsiteContentAdminRoutes.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('RestoByte Backend is running!');
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
app.use('/api/outlets', outletRoutes);
app.use('/api/public', saasWebsiteContentRoutes);
app.use('/api/saas', saasWebsiteContentAdminRoutes);

async function start() {
  try {
    await prisma.$connect();
    console.log('[database]: Connected to database successfully');
  } catch (error) {
    console.error('[database]: Failed to connect to database', error);
    process.exit(1);
  }

  if (process.env.SEED_DEMO_USERS === 'true') {
    try {
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
        update: { tenantId: tenant.id },
        create: {
          id: 'outlet-1',
          name: 'Main Outlet',
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
    } catch (error) {
      console.error('[seed]: Failed to seed demo users', error);
    }
  }

  try {
    const existingCount = await prisma.currency.count();
    if (existingCount === 0) {
      await prisma.currency.create({
        data: {
          name: 'US Dollar',
          code: 'USD',
          symbol: '$',
          exchangeRate: 1,
          isDefault: true,
        },
      });
      console.log('[database]: Seeded default currency (USD)');
    }
  } catch (error) {
    console.error('[database]: Failed to ensure default currency', error);
  }

  app.listen(port, host, () => {
    console.log(`[server]: Server is running at http://${host}:${port}`);
  });
}

start();
