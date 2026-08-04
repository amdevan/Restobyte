import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import {
  getPendingJobsForOutlet,
  completePrintJob,
  getPrintJobResult,
  getConnectedAgentsForOutlet,
  isPrintAgentAvailable,
  getAllAgentPrintersForOutlet,
} from '../services/printAgentService.js';

/**
 * GET /api/print-agent/status
 * Check if a Print Agent is connected for the current outlet.
 */
export const getAgentStatus = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const queryOutletId = typeof (req.query as any)?.outletId === 'string'
    ? String((req.query as any).outletId)
    : undefined;
  const outletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);

  if (!outletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }

  const agents = getConnectedAgentsForOutlet(outletId);
  const available = isPrintAgentAvailable(outletId);

  res.json({
    available,
    agents,
    agentCount: agents.length,
  });
};

/**
 * GET /api/print-agent/printers
 * Get printers detected by the Print Agent for the current outlet.
 */
export const getAgentPrinters = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const queryOutletId = typeof (req.query as any)?.outletId === 'string'
    ? String((req.query as any).outletId)
    : undefined;
  const outletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);

  if (!outletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }

  const printers = getAllAgentPrintersForOutlet(outletId);
  res.json({ printers });
};

/**
 * GET /api/print-agent/jobs
 * REST fallback: Get pending print jobs for the current outlet.
 * The Print Agent polls this endpoint if WebSocket is unavailable.
 */
export const getPendingJobs = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const queryOutletId = typeof (req.query as any)?.outletId === 'string'
    ? String((req.query as any).outletId)
    : undefined;
  const outletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);

  if (!outletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }

  const jobs = getPendingJobsForOutlet(outletId);
  res.json({ jobs });
};

/**
 * POST /api/print-agent/jobs/:jobId/complete
 * REST fallback: Report print job completion result.
 */
export const completeJob = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const jobId = req.params.jobId as string;
  const { status, error } = req.body as { status: 'completed' | 'failed'; error?: string };

  if (!status || !['completed', 'failed'].includes(status)) {
    res.status(400).json({ message: 'Valid status is required (completed or failed)' });
    return;
  }

  const success = completePrintJob(jobId, status, error);

  if (!success) {
    res.status(404).json({ message: 'Print job not found' });
    return;
  }

  res.json({ message: 'Print job result recorded' });
};

/**
 * GET /api/print-agent/jobs/:jobId/result
 * Check the result of a previously submitted print job.
 */
export const getJobResult = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const jobId = req.params.jobId as string;
  const result = getPrintJobResult(jobId);

  if (!result) {
    res.status(404).json({ message: 'Print job result not found or job still pending' });
    return;
  }

  res.json({ result });
};
