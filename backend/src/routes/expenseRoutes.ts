import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
} from '../controllers/expenseController.js';

const router = Router();
router.use(authenticate);

router.get('/categories', requirePermission('purchase.view'), getExpenseCategories);
router.post('/categories', requirePermission('purchase.create'), createExpenseCategory);
router.delete('/categories/:id', requirePermission('purchase.delete'), deleteExpenseCategory);

router.get('/', requirePermission('purchase.view'), getExpenses);
router.post('/', requirePermission('purchase.create'), createExpense);
router.put('/:id', requirePermission('purchase.edit'), updateExpense);
router.delete('/:id', requirePermission('purchase.delete'), deleteExpense);

export default router;
