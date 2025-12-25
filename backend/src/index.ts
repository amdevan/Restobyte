import express from 'express';
import type { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
// For production, use specific origin:
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true
// }));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('RestoByte Backend is running!');
});

import helloRoutes from './routes/helloRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import menuItemRoutes from './routes/menuItemRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import fonepayRoutes from './routes/fonepayRoutes.js';
import authRoutes from './routes/authRoutes.js';
import currencyRoutes from './routes/currencyRoutes.js';
import prisma from './db/prisma.js';

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
