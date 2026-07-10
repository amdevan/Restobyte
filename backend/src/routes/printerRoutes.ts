import express from 'express';
import { getSystemPrinters, getPrinters, createPrinter, updatePrinter, deletePrinter } from '../controllers/printerController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/system', getSystemPrinters);

router.get('/', getPrinters);

router.use(authenticate);

router.post('/', createPrinter);
router.put('/:id', updatePrinter);
router.delete('/:id', deletePrinter);

export default router;
