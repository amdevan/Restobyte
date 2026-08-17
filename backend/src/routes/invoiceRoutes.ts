import { Router } from 'express';
import { getInvoices, getInvoice, createInvoice, updateInvoice, addPayment, getPublicInvoice } from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = Router();

router.get('/', authenticate, requirePermission('invoice.view'), getInvoices);
router.get('/:id', authenticate, requirePermission('invoice.view'), getInvoice);
router.post('/', authenticate, requirePermission('invoice.create'), createInvoice);
router.put('/:id', authenticate, requirePermission('invoice.edit'), updateInvoice);
router.post('/:id/payments', authenticate, requirePermission('accounting.manage'), addPayment);
router.get('/public/:id', getPublicInvoice);

export default router;
