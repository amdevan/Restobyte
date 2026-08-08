import { Router } from 'express';
import { createCustomer, deleteCustomer, getCustomers, updateCustomer } from '../controllers/customerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireFeature } from '../middleware/planGuard.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = Router();

router.use(authenticate);
router.use(requireFeature('customers'));

router.get('/', requirePermission('customers.view'), getCustomers);
router.post('/', requirePermission('customers.create'), createCustomer);
router.put('/:id', requirePermission('customers.edit'), updateCustomer);
router.delete('/:id', requirePermission('customers.delete'), deleteCustomer);

export default router;
