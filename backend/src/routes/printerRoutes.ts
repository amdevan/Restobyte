import express from 'express';
import {
  bridgeHeartbeat,
  claimUsbBridgeJob,
  completeUsbBridgeJob,
  createPrinter,
  deletePrinter,
  failUsbBridgeJob,
  getPrinters,
  getSystemPrinters,
  getUsbBridgeSetup,
  printDocument,
  rotateUsbBridgeToken,
  updatePrinter
} from '../controllers/printerController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/system', getSystemPrinters);
router.post('/bridge/heartbeat', bridgeHeartbeat);
router.post('/bridge/jobs/claim', claimUsbBridgeJob);
router.post('/bridge/jobs/:id/complete', completeUsbBridgeJob);
router.post('/bridge/jobs/:id/fail', failUsbBridgeJob);

router.use(authenticate);

router.get('/bridge/setup', getUsbBridgeSetup);
router.post('/bridge/token', rotateUsbBridgeToken);
router.get('/', getPrinters);
router.post('/', createPrinter);
router.post('/print', printDocument);
router.put('/:id', updatePrinter);
router.delete('/:id', deletePrinter);

export default router;
