import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  recordSupplierPayment,
} from '../controllers/purchaseController.js';

const router = Router();
router.use(authenticate);

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);
router.post('/:id/payments', recordSupplierPayment);

export default router;
