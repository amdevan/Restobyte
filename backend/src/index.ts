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

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Basic connectivity routes
app.get('/', (req: Request, res: Response) => {
  res.send('RestoByte Backend is running!');
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is reachable at root /health' });
});

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;

    res.json({
      status: 'healthy',
      database: 'connected',
      latency: `${duration}ms`,
      env: {
        node_env: process.env.NODE_ENV,
        has_db_url: !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    console.error('Health Check Failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : String(error),
      hint: 'Verify DATABASE_URL and network access to database in Coolify.'
    });
  }
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

app.listen(port, async () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);

  try {
    await prisma.$connect();
    console.log('[database]: Connected to database successfully');
  } catch (error) {
    console.error('[database]: Failed to connect to database', error);
  }
});
