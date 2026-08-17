import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/authMiddleware.js';
import { createPlan, deletePlan, listPlans, updatePlan } from '../controllers/planController.js';

const router = Router();

const requireSuperAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  next();
};

// Public: list plans for registration/pricing page
router.get('/', listPlans);
// Protected: create/update/delete plans (superadmin only)
router.use(authenticate);
router.post('/', requireSuperAdmin, createPlan);
router.put('/:id', requireSuperAdmin, updatePlan);
router.delete('/:id', requireSuperAdmin, deletePlan);

export default router;
