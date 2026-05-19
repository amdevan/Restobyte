import express from 'express';
import type { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './db/prisma.js';

// Import routes
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
import saasWebsiteContentRoutes from './routes/saasWebsiteContentRoutes.js';
import saasWebsiteContentAdminRoutes from './routes/saasWebsiteContentAdminRoutes.js';

dotenv.config();

const app: Express = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('RestoByte Backend is running!');
});

// API Routes
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
