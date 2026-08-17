import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  setDefaultCurrency,
} from '../controllers/currencyController.js';

const router = express.Router();

// Public: list currencies for registration/pricing
router.get('/', getCurrencies);
// Protected: create/update/delete currencies
router.use(authenticate);
router.post('/', requirePermission('settings.edit'), createCurrency);
router.put('/:id', requirePermission('settings.edit'), updateCurrency);
router.delete('/:id', requirePermission('settings.edit'), deleteCurrency);
router.post('/:id/set-default', requirePermission('settings.edit'), setDefaultCurrency);

export default router;
