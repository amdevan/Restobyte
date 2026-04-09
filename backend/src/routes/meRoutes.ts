import { Router } from 'express';
import { getMyProfile, updateMyProfile, getMyOrders, getMyReservations, createReservation } from '../controllers/meController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);
router.get('/orders', getMyOrders);
router.get('/reservations', getMyReservations);
router.post('/reservations', createReservation);

export default router;