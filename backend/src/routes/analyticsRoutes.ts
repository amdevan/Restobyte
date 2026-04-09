import { Router } from 'express';
import { signupsPerWeek } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.get('/signups-weekly', signupsPerWeek);

export default router;
