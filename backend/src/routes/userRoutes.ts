import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createUser, deleteUser, getUsers, updateUser } from '../controllers/userController.js';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
