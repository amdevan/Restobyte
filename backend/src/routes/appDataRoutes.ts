import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getAppData, getGlobalAppData, getUserAppData, upsertAppData, upsertGlobalAppData, upsertUserAppData } from '../controllers/appDataController.js';

const router = Router();

router.use(authenticate);

router.get('/user/:key', getUserAppData);
router.put('/user/:key', upsertUserAppData);
router.get('/global/:key', getGlobalAppData);
router.put('/global/:key', upsertGlobalAppData);
router.get('/:key', getAppData);
router.put('/:key', upsertAppData);

export default router;
