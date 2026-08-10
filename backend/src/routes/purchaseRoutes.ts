import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
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

router.get('/', requirePermission('purchase.view'), getPurchases);
router.get('/:id', requirePermission('purchase.view'), getPurchaseById);
router.post('/', requirePermission('purchase.create'), createPurchase);
router.put('/:id', requirePermission('purchase.edit'), updatePurchase);
router.delete('/:id', requirePermission('purchase.delete'), deletePurchase);
router.post('/:id/payments', requirePermission('purchase.edit'), recordSupplierPayment);

export default router;
