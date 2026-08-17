import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';
import { createQR, getStatus, markPaid } from '../controllers/fonepayController.js';

const router = Router();

// All fonepay routes require authentication
router.use(authenticate);

// Create a new Fonepay QR session
router.post('/create-qr', requirePermission('accounting.manage'), createQR);

// Poll the status of a QR session
router.get('/status', requirePermission('accounting.manage'), getStatus);

// Prototype-only: manually mark a session as paid (replace with webhook in production)
router.post('/mark-paid', requirePermission('accounting.manage'), markPaid);

export default router;

