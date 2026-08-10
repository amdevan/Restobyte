import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
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

router.get('/categories', getExpenseCategories);
router.post('/categories', createExpenseCategory);
router.delete('/categories/:id', deleteExpenseCategory);

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
