import { Router } from 'express';
import { getInvoices, getInvoice, createInvoice, updateInvoice, addPayment, getPublicInvoice } from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, getInvoice);
router.post('/', authenticate, createInvoice);
router.put('/:id', authenticate, updateInvoice);
router.post('/:id/payments', authenticate, addPayment);
router.get('/public/:id', getPublicInvoice);

export default router;
