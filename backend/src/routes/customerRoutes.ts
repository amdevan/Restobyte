import { Router } from 'express';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../controllers/customerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireFeature } from '../middleware/planGuard.js';

const router = Router();

router.use(authenticate);
router.use(requireFeature('customers'));

router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
