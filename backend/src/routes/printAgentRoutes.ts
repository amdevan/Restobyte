import express from 'express';
import {
  getAgentStatus,
  getAgentPrinters,
  getPendingJobs,
  completeJob,
  getJobResult,
} from '../controllers/printAgentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requirePermission } from '../utils/roleUtils.js';

const router = express.Router();

// All print agent routes require authentication
router.use(authenticate);

router.get('/status', requirePermission('settings.view'), getAgentStatus);
router.get('/printers', requirePermission('settings.view'), getAgentPrinters);
router.get('/jobs', requirePermission('settings.view'), getPendingJobs);
router.post('/jobs/:jobId/complete', requirePermission('settings.edit'), completeJob);
router.get('/jobs/:jobId/result', requirePermission('settings.view'), getJobResult);

export default router;
