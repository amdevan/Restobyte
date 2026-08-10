import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
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
router.post('/', createCurrency);
router.put('/:id', updateCurrency);
router.delete('/:id', deleteCurrency);
router.post('/:id/set-default', setDefaultCurrency);

export default router;
