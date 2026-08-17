import express, { Request, Response, NextFunction } from 'express';
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
import reportsRoutes from './routes/reportsRoutes.js';
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
import printerRoutes from './routes/printerRoutes.js';
import printAgentRoutes from './routes/printAgentRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import googleDriveRoutes from './routes/googleDriveRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import { DEFAULT_PLAN_DEFINITIONS } from './utils/planConfig.js';
import { ensureSystemRoles } from './utils/roleUtils.js';
import { startScheduler } from './services/autoBackupService.js';
import { backfillMissingInvoices } from './services/invoiceService.js';
import { createPrintAgentWebSocketServer, closePrintAgentWebSocketServer } from './services/printAgentService.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.method !== 'OPTIONS') {
    const start = Date.now();
    _res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000 || _res.statusCode >= 400) {
        console.warn(`[server] ${req.method} ${req.originalUrl} ${_res.statusCode} ${duration}ms`);
      }
    });
  }
  next();
});

// CORS and body parsing
// Production-safe CORS: dynamic origin matching so any mobile browser (Android Chrome,
// iPhone Safari) can hit public endpoints without auth cookie issues.
// When CREDENTIALS mode is used, we echo the exact origin (never wildcard).
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, callback) => {
    // No origin (e.g. same-origin, curl, server-to-server) → allow
    if (!origin) {
      callback(null, true);
      return;
    }
    // Explicitly whitelisted → allow
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    // Production: public pages / QR menus may come from any origin (mobile browsers).
    // Reflect the origin so credentials/cookies still work for same-tenant requests.
    if (isProduction) {
      callback(null, origin);
      return;
    }
    // Dev: lenient — allow anything
    callback(null, true);
  },
  credentials: true,
  // Allow standard headers including range for blobs / downloads
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range', 'Accept'],
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'X-Total-Count'],
}));
app.use(express.json({ limit: '25mb' }));

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
// Reports — give them a long timeout (10 min) since large exports can be slow
app.use('/api/reports', (req, _res, next) => {
  req.setTimeout(10 * 60 * 1000, () => {
    console.warn(`[server] Report request timed out: ${req.method} ${req.originalUrl}`);
  });
  next();
}, reportsRoutes);
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
app.use('/api/printers', printerRoutes);
app.use('/api/print-agent', printAgentRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/google-drive', googleDriveRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reservations', reservationRoutes);

// Global error handler — catches any unhandled errors from route handlers
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);
  const message = process.env.NODE_ENV === 'development' 
    ? (err?.message || 'Internal server error') 
    : 'Internal server error';
  res.status(err?.statusCode || 500).json({ message });
});

async function start() {
  try {
    await prisma.$connect();
    console.log('[database]: Connected to database successfully');
  } catch (error) {
    console.error('[database]: Failed to connect to database', error);
    process.exit(1);
  }

  // Auto-migrate: ensure missing columns exist in production database
  try {
    console.log('[bootstrap]: Running auto-migrations...');
    const migrations = [
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'tableNumber') THEN ALTER TABLE \"Order\" ADD COLUMN \"tableNumber\" TEXT; END IF; END $$;",
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'employeeId') THEN ALTER TABLE \"User\" ADD COLUMN \"employeeId\" TEXT; END IF; END $$;",
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'outletIds') THEN ALTER TABLE \"User\" ADD COLUMN \"outletIds\" JSONB; END IF; END $$;",
    ];
    for (const sql of migrations) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('[bootstrap]: Auto-migrations complete');
  } catch (error: any) {
    console.error('[bootstrap]: Auto-migration failed:', error?.message);
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

  // Start auto-backup scheduler
  try {
    startScheduler();
  } catch (error) {
    console.error('[bootstrap]: Failed to start auto-backup scheduler', error);
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

  const httpServer = app.listen(port, host, () => {
    console.log(`[server]: Server is running at http://${host}:${port}`);

    // Start the Print Agent WebSocket server on the same HTTP server
    createPrintAgentWebSocketServer(httpServer);
  });
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    closePrintAgentWebSocketServer();
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

start();
