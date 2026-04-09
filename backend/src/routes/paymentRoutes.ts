import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createPayment } from '../controllers/paymentController.js';

const router = Router();
router.use(authenticate);

router.post('/', createPayment);

export default router;
