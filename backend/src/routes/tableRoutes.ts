import { Router } from 'express';
import { createTable, deleteTable, getTables, updateTableStatus, updateTable } from '../controllers/tableController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { ensureTableLimit } from '../middleware/planGuard.js';

const router = Router();

router.use(authenticate);

router.get('/', getTables);
router.post('/', ensureTableLimit, createTable);
router.put('/:id', updateTable);
router.put('/:id/status', updateTableStatus);
router.delete('/:id', deleteTable);

export default router;
