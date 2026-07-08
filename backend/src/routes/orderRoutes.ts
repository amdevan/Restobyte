import { Router } from 'express';
import { createOrder, getOrder, getOrders, getPublicOrder, updateOrder, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Public route
router.get('/public/:id', getPublicOrder);

router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.put('/:id/status', updateOrderStatus);

export default router;
