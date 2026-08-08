import { Router, Request, Response } from 'express';
import { createOrder, getOrder, getOrders, getPublicOrder, updateOrder, updateOrderStatus, returnOrder } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import prisma from '../db/prisma.js';

const router = Router();

// Public routes — no auth required
router.get('/public/:id', getPublicOrder);

router.post('/public', async (req: Request, res: Response) => {
  try {
    const { outletId, tableId, customerName, customerPhone, items, note } = req.body;
    if (!outletId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'outletId and items are required' });
      return;
    }
    const normalized = items
      .map((it: any) => ({
        menuItemId: typeof it?.menuItemId === 'string' ? it.menuItemId : '',
        quantity: Number(it?.quantity || 0),
        unitPrice: Number(it?.unitPrice ?? it?.price ?? 0),
      }))
      .filter((it: any) => it.menuItemId && it.quantity > 0);
    if (normalized.length === 0) {
      res.status(400).json({ message: 'No valid items' });
      return;
    }
    const total = normalized.reduce((sum: number, it: any) => sum + it.quantity * it.unitPrice, 0);

    // Look up table name so POS can display it
    let tableName: string | null = null;
    if (tableId) {
      const tableRecord = await prisma.table.findUnique({
        where: { id: tableId },
        select: { name: true },
      });
      tableName = tableRecord?.name || null;
    }

    const order = await prisma.order.create({
      data: {
        outletId,
        tableNumber: tableId || null,
        status: 'PENDING',
        total,
        saleData: {
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || '',
          note: note || '',
          source: 'qr-menu',
          orderType: 'Dine In',
          assignedTableId: tableId || null,
          assignedTableName: tableName,
          items: normalized,
        },
        items: {
          create: normalized.map((it: any) => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        },
      },
      include: { items: { include: { menuItem: true } } },
    });

    // Update table status to Occupied so it shows in the POS table grid
    if (tableId) {
      try {
        await prisma.table.update({
          where: { id: tableId },
          data: { status: 'Occupied', occupiedSince: new Date() },
        });
      } catch (e) {
        console.error('[public order] failed to update table status:', e);
      }
    }

    res.status(201).json({ orderId: order.id, order });
  } catch (error: any) {
    console.error('[public order] error:', error);
    res.status(500).json({ message: 'Failed to create order', detail: error?.message });
  }
});

router.use(authenticate);

router.get('/', requirePermission('orders.view'), getOrders);
router.get('/:id', requirePermission('orders.view'), getOrder);
router.post('/', requirePermission('pos.create'), createOrder);
router.put('/:id', requirePermission('orders.edit'), updateOrder);
router.put('/:id/status', requirePermission('orders.edit'), updateOrderStatus);
router.post('/:id/return', requirePermission('pos.return'), returnOrder);

export default router;
