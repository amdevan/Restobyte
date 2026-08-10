import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createQR, getStatus, markPaid } from '../controllers/fonepayController.js';

const router = Router();

// All fonepay routes require authentication
router.use(authenticate);

// Create a new Fonepay QR session
router.post('/create-qr', createQR);

// Poll the status of a QR session
router.get('/status', getStatus);

// Prototype-only: manually mark a session as paid (replace with webhook in production)
router.post('/mark-paid', markPaid);

export default router;

