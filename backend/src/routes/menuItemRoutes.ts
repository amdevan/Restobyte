import { Router } from 'express';
import { createMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from '../controllers/menuItemController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = Router();

router.get('/', getMenuItems);

router.use(authenticate);
router.post('/', requirePermission('menu.create'), createMenuItem);
router.put('/:id', requirePermission('menu.edit'), updateMenuItem);
router.delete('/:id', requirePermission('menu.delete'), deleteMenuItem);

export default router;