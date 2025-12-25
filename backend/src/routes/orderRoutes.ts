import { Router } from 'express';
import { createOrder, getOrder, getOrders, updateOrderStatus } from '../controllers/orderController.js';

const router = Router();

router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;