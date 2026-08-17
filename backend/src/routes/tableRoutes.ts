import { Router } from 'express';
import { createTable, deleteTable, getTables, updateTableStatus, updateTable } from '../controllers/tableController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { ensureTableLimit } from '../middleware/planGuard.js';
import prisma from '../db/prisma.js';

const router = Router();

// Public endpoint — no auth required, used by QR menu
router.get('/public/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: {
        id: true,
        name: true,
        capacity: true,
        status: true,
        outletId: true,
      },
    });
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }
    const outlet = await prisma.outlet.findUnique({
      where: { id: table.outletId },
      select: {
        id: true,
        name: true,
        slug: true,
        restaurantName: true,
        logoUrl: true,
        address: true,
        phone: true,
      },
    });
    res.json({ table, outlet });
  } catch (error) {
    console.error('[public table] error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.use(authenticate);

router.get('/', requirePermission('tables.view'), getTables);
router.post('/', requirePermission('tables.create'), ensureTableLimit, createTable);
router.put('/:id', requirePermission('tables.edit'), updateTable);
router.put('/:id/status', requirePermission('tables.edit'), updateTableStatus);
router.delete('/:id', requirePermission('tables.delete'), deleteTable);

export default router;
