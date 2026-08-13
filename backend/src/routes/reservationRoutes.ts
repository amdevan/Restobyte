import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authMiddleware.js';
import { getReservations, createReservation, updateReservation, deleteReservation } from '../controllers/reservationController.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('orders.view'), getReservations);
router.post('/', requirePermission('orders.create'), createReservation);
router.put('/:id', requirePermission('orders.edit'), updateReservation);
router.delete('/:id', requirePermission('orders.edit'), deleteReservation);

export default router;
