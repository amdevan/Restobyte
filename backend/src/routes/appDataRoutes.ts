import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { getAppData, getGlobalAppData, getUserAppData, upsertAppData, upsertGlobalAppData, upsertUserAppData } from '../controllers/appDataController.js';

const router = Router();

router.use(authenticate);

router.get('/user/:key', requirePermission('settings.view'), getUserAppData);
router.put('/user/:key', requirePermission('settings.edit'), upsertUserAppData);
router.get('/global/:key', requirePermission('settings.view'), getGlobalAppData);
router.put('/global/:key', requirePermission('settings.edit'), upsertGlobalAppData);
router.get('/:key', requirePermission('settings.view'), getAppData);
router.put('/:key', requirePermission('settings.edit'), upsertAppData);

export default router;
