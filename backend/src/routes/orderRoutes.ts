import { Router } from 'express';
import { createOrder, getOrder, getOrders, getPublicOrder, updateOrder, updateOrderStatus, returnOrder, deleteOrder, createPublicOrder } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = Router();

// Public routes — no auth required
router.get('/public/:id', getPublicOrder);
router.post('/public', createPublicOrder);

router.use(authenticate);

router.get('/', requirePermission('orders.view'), getOrders);
router.get('/:id', requirePermission('orders.view'), getOrder);
router.post('/', requirePermission('pos.create'), createOrder);
router.put('/:id', requirePermission('orders.edit'), updateOrder);
router.put('/:id/status', requirePermission('orders.edit'), updateOrderStatus);
router.delete('/:id', requirePermission('pos.delete'), deleteOrder);
router.post('/:id/return', requirePermission('pos.return'), returnOrder);

export default router;
