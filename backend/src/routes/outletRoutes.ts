import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createOutlet, deleteOutlet, listOutlets, updateOutlet } from '../controllers/outletController.js';

const router = Router();

router.use(authenticate);
router.get('/', listOutlets);
router.post('/', createOutlet);
router.put('/:id', updateOutlet);
router.delete('/:id', deleteOutlet);

export default router;
