import express from 'express';
import { getSystemPrinters, getPrinters, createPrinter, updatePrinter, deletePrinter, printDocument } from '../controllers/printerController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/system', getSystemPrinters);

router.get('/', getPrinters);

router.use(authenticate);

router.post('/', createPrinter);
router.post('/print', printDocument);
router.put('/:id', updatePrinter);
router.delete('/:id', deletePrinter);

export default router;
