import { Router } from 'express';
import { createOrder, getOrder, getOrders, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);

export default router;