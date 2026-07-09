import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createOutlet, deleteOutlet, listOutlets, updateOutlet, getOutletBySlug } from '../controllers/outletController.js';

const router = Router();

// Public route
router.get('/slug/:slug', getOutletBySlug);

// Protected routes
router.use(authenticate);
router.get('/', listOutlets);
router.post('/', createOutlet);
router.put('/:id', updateOutlet);
router.delete('/:id', deleteOutlet);

export default router;
