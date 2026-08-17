import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = Router();

router.get('/', getCategories);

router.use(authenticate);

router.post('/', requirePermission('menu.create'), createCategory);
router.put('/:id', requirePermission('menu.edit'), updateCategory);
router.delete('/:id', requirePermission('menu.delete'), deleteCategory);

export default router;