import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { createRole, deleteRole, getRoles, updateRole, getPermissions } from '../controllers/roleController.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('users.view'), getRoles);
router.get('/permissions', requirePermission('users.view'), getPermissions);
router.post('/', requirePermission('users.create'), createRole);
router.put('/:id', requirePermission('users.edit'), updateRole);
router.delete('/:id', requirePermission('users.delete'), deleteRole);

export default router;
