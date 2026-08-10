import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { createUser, deleteUser, getUsers, updateUser } from '../controllers/userController.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('users.view'), getUsers);
router.post('/', requirePermission('users.create'), createUser);
router.put('/:id', requirePermission('users.edit'), updateUser);
router.delete('/:id', requirePermission('users.delete'), deleteUser);

export default router;
