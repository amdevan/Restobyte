import express from 'express';
import { createTenant, listTenants, updateTenant, deleteTenant, getTenantDetails, getMyTenantCurrency, getMyTenantEntitlements, updateMyTenantPlan, sendInvoiceReminder } from '../controllers/tenantController.js';
import { authenticate, type AuthRequest } from '../middleware/authMiddleware.js';

const router = express.Router();

const requireSuperAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};

// Public: create tenant during registration
router.post('/', createTenant);
// All other routes require authentication
router.use(authenticate);
router.get('/', requireSuperAdmin, listTenants);
router.get('/:id/details', requireSuperAdmin, getTenantDetails);
router.put('/:id', requireSuperAdmin, updateTenant);
router.delete('/:id', requireSuperAdmin, deleteTenant);
router.post('/:id/invoices/:invoiceId/remind', requireSuperAdmin, sendInvoiceReminder);
router.get('/me-currency', getMyTenantCurrency);
router.get('/me-entitlements', getMyTenantEntitlements);
router.put('/me-plan', updateMyTenantPlan);

export default router;
