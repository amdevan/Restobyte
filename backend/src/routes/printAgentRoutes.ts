import express from 'express';
import {
  getAgentStatus,
  getAgentPrinters,
  getPendingJobs,
  completeJob,
  getJobResult,
} from '../controllers/printAgentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All print agent routes require authentication
router.use(authenticate);

router.get('/status', getAgentStatus);
router.get('/printers', getAgentPrinters);
router.get('/jobs', getPendingJobs);
router.post('/jobs/:jobId/complete', completeJob);
router.get('/jobs/:jobId/result', getJobResult);

export default router;
