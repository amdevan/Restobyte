import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createPlan, deletePlan, listPlans, updatePlan } from '../controllers/planController.js';

const router = Router();

// Public: list plans for registration/pricing page
router.get('/', listPlans);
// Protected: create/update/delete plans (superadmin only)
router.use(authenticate);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

export default router;
