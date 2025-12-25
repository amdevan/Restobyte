import { Router } from 'express';
import { createMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from '../controllers/menuItemController.js';

const router = Router();

router.get('/', getMenuItems);
router.post('/', createMenuItem);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);

export default router;