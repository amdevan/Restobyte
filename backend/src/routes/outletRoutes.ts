import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { createOutlet, deleteOutlet, listOutlets, updateOutlet, getOutletBySlug } from '../controllers/outletController.js';

const router = Router();

const requireSuperAdminOrSettingsEdit = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.isSuperAdmin) return next();
  return requirePermission('settings.edit')(req, res, next);
};

// Public route
router.get('/slug/:slug', getOutletBySlug);

// Protected routes
router.use(authenticate);
router.get('/', requireSuperAdminOrSettingsEdit, listOutlets);
router.post('/', requireSuperAdminOrSettingsEdit, createOutlet);
router.put('/:id', requireSuperAdminOrSettingsEdit, updateOutlet);
router.delete('/:id', requireSuperAdminOrSettingsEdit, deleteOutlet);

export default router;
