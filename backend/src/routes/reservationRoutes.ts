import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { getReservations, createReservation, updateReservation, deleteReservation } from '../controllers/reservationController.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('reservations.view'), getReservations);
router.post('/', requirePermission('reservations.create'), createReservation);
router.put('/:id', requirePermission('reservations.edit'), updateReservation);
router.delete('/:id', requirePermission('reservations.delete'), deleteReservation);

export default router;
