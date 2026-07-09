import { Router } from 'express';
import { getInvoices, getInvoice, createInvoice, updateInvoice, addPayment, getPublicInvoice } from '../controllers/invoiceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware, getInvoices);
router.get('/:id', authMiddleware, getInvoice);
router.post('/', authMiddleware, createInvoice);
router.put('/:id', authMiddleware, updateInvoice);
router.post('/:id/payments', authMiddleware, addPayment);
router.get('/public/:id', getPublicInvoice);

export default router;
