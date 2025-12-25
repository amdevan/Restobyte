import express from 'express';
import {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  setDefaultCurrency,
} from '../controllers/currencyController.js';

const router = express.Router();

router.get('/', getCurrencies);
router.post('/', createCurrency);
router.put('/:id', updateCurrency);
router.delete('/:id', deleteCurrency);
router.post('/:id/set-default', setDefaultCurrency);

export default router;
