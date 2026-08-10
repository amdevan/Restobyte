import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { createPayment } from '../controllers/paymentController.js';

const router = Router();
router.use(authenticate);

router.post('/', requirePermission('accounting.manage'), createPayment);

export default router;
