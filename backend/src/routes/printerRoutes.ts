import express from 'express';
import { getSystemPrinters, getPrinters, createPrinter, updatePrinter, deletePrinter, printDocument } from '../controllers/printerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = express.Router();

router.use(authenticate);

router.get('/system', requirePermission('settings.view'), getSystemPrinters);
router.get('/', requirePermission('settings.view'), getPrinters);

router.post('/', requirePermission('settings.edit'), createPrinter);
router.post('/print', requirePermission('settings.edit'), printDocument);
router.put('/:id', requirePermission('settings.edit'), updatePrinter);
router.delete('/:id', requirePermission('settings.edit'), deletePrinter);

export default router;
