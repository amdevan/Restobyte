import { Router } from 'express';
import { createMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from '../controllers/menuItemController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getMenuItems);

router.use(authenticate);
router.post('/', createMenuItem);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);

export default router;