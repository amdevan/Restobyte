import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createRole, deleteRole, getRoles, updateRole } from '../controllers/roleController.js';

const router = Router();

router.use(authenticate);

router.get('/', getRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
