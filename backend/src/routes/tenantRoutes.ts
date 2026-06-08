import express from 'express';
import { createTenant, listTenants, updateTenant, deleteTenant, getTenantDetails, getMyTenantCurrency, getMyTenantEntitlements, sendInvoiceReminder } from '../controllers/tenantController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createTenant);
router.get('/', listTenants);
router.get('/:id/details', getTenantDetails);
router.post('/:id/invoices/:invoiceId/remind', authenticate, sendInvoiceReminder);
router.get('/me-currency', authenticate, getMyTenantCurrency);
router.get('/me-entitlements', authenticate, getMyTenantEntitlements);
router.put('/:id', updateTenant);
router.delete('/:id', deleteTenant);

export default router;
