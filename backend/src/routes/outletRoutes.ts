import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { listOutlets } from '../controllers/outletController.js';

const router = Router();

router.use(authenticate);
router.get('/', listOutlets);

export default router;
