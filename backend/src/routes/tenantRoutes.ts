import express from 'express';
import { createTenant, listTenants, updateTenant, deleteTenant, getTenantDetails, getMyTenantCurrency, getMyTenantEntitlements, updateMyTenantPlan, sendInvoiceReminder } from '../controllers/tenantController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: create tenant during registration
router.post('/', createTenant);
// All other routes require authentication
router.use(authenticate);
router.get('/', listTenants);
router.get('/:id/details', getTenantDetails);
router.put('/:id', updateTenant);
router.delete('/:id', deleteTenant);
router.post('/:id/invoices/:invoiceId/remind', sendInvoiceReminder);
router.get('/me-currency', getMyTenantCurrency);
router.get('/me-entitlements', getMyTenantEntitlements);
router.put('/me-plan', updateMyTenantPlan);

export default router;
