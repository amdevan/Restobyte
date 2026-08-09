import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// Type for extended WebSocket properties
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  agentId?: string;
  outletId?: string;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrintType = 'test' | 'invoice' | 'kot' | 'bot' | 'delivery';

export interface PrintAgentInfo {
  agentId: string;
  tenantId: string;
  outletId: string;
  version: string;
  platform: string;
  hostname: string;
  connectedAt: string;
}

export interface PrintJob {
  jobId: string;
  printerId: string;
  printerName: string;
  content: string;
  printType: PrintType;
  timestamp: string;
  outletId: string;
  tenantId: string;
  paperSize?: string;
  interfaceType?: string;
  ipAddress?: string;
  port?: string;
  usbPath?: string;
  bluetoothMac?: string;
  serialPort?: string;
  baudRate?: number;
  timeoutMs?: number;
  retries?: number;
}

export interface PrintJobResult {
  jobId: string;
  status: 'completed' | 'failed';
  error?: string;
}

// Internal agent record
interface AgentRecord {
  ws: ExtendedWebSocket;
  info: PrintAgentInfo;
  lastSeen: number;
}

// ---------------------------------------------------------------------------
// In-memory registries
// ---------------------------------------------------------------------------

// agentId -> AgentRecord
const agents = new Map<string, AgentRecord>();

// outletId -> Set of agentIds
const outletAgents = new Map<string, Set<string>>();

// jobId -> PrintJob (pending, awaiting agent pickup or WS delivery)
const pendingJobs = new Map<string, PrintJob>();

// jobId -> PrintJobResult (recently completed jobs, kept briefly for REST polling)
const completedJobs = new Map<string, PrintJobResult>();

// Cache of printers detected by each agent
const agentPrinters = new Map<string, any[]>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const COMPLETED_JOB_TTL = 5 * 60_000; // 5 minutes

function cleanupCompletedJobs() {
  const now = Date.now();
  for (const [jobId] of completedJobs) {
    const job = pendingJobs.get(jobId);
    if (job && now - new Date(job.timestamp).getTime() > COMPLETED_JOB_TTL) {
      completedJobs.delete(jobId);
      pendingJobs.delete(jobId);
    }
  }
}

// Find an agent for a given outlet (first available)
function findAgentByOutlet(outletId: string): AgentRecord | undefined {
  const agentIds = outletAgents.get(outletId);
  if (!agentIds || agentIds.size === 0) return undefined;

  for (const agentId of agentIds) {
    const record = agents.get(agentId);
    if (record && record.ws.readyState === WebSocket.OPEN) {
      return record;
    }
  }
  return undefined;
}

// Send a message to a specific WebSocket connection safely
function safeSend(ws: ExtendedWebSocket, data: unknown): boolean {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Print job dispatch
// ---------------------------------------------------------------------------

/**
 * Attempt to send a print job to a connected Print Agent via WebSocket.
 * Returns true if the job was dispatched via WebSocket, false if no agent
 * is available (the caller should fall back to REST polling or OS printing).
 */
export function dispatchPrintJobToAgent(job: PrintJob): boolean {
  const agent = findAgentByOutlet(job.outletId);
  if (!agent) return false;

  const dispatched = safeSend(agent.ws, {
    type: 'print_job',
    job,
  });

  if (dispatched) {
    // Track the job so the agent can report back the result
    pendingJobs.set(job.jobId, job);
  }

  return dispatched;
}

/**
 * Store a print job for REST API fallback polling.
 * The Print Agent will poll this endpoint if WebSocket is unavailable.
 */
export function storePendingJob(job: PrintJob): void {
  pendingJobs.set(job.jobId, job);
}

/**
 * Retrieve pending jobs for a given outlet (REST fallback).
 */
export function getPendingJobsForOutlet(outletId: string): PrintJob[] {
  cleanupCompletedJobs();
  return Array.from(pendingJobs.values()).filter(
    (job) => job.outletId === outletId
  );
}

/**
 * Mark a job as completed and store the result.
 */
export function completePrintJob(
  jobId: string,
  status: 'completed' | 'failed',
  error?: string
): boolean {
  const job = pendingJobs.get(jobId);
  if (!job) return false;

  const result: PrintJobResult = { jobId, status, ...(error !== undefined ? { error } : {}) };
  completedJobs.set(jobId, result);
  pendingJobs.delete(jobId);
  return true;
}

/**
 * Check if a print job has been completed and get its result.
 */
export function getPrintJobResult(jobId: string): PrintJobResult | undefined {
  return completedJobs.get(jobId);
}

/**
 * Get all connected agents for a tenant (for status reporting).
 */
export function getConnectedAgents(): PrintAgentInfo[] {
  return Array.from(agents.values()).map((record) => record.info);
}

/**
 * Get connected agents for a specific outlet.
 */
export function getConnectedAgentsForOutlet(outletId: string): PrintAgentInfo[] {
  const agentIds = outletAgents.get(outletId);
  if (!agentIds) return [];

  return Array.from(agentIds)
    .map((id) => agents.get(id))
    .filter((record): record is AgentRecord => record !== undefined)
    .map((record) => record.info);
}

/**
 * Check if any Print Agent is connected for a given outlet.
 */
export function isPrintAgentAvailable(outletId: string): boolean {
  return findAgentByOutlet(outletId) !== undefined;
}

/**
 * Get printers detected by a specific agent.
 */
export function getAgentPrinters(agentId: string): any[] {
  return agentPrinters.get(agentId) || [];
}

/**
 * Get all printers detected by all agents for an outlet.
 */
export function getAllAgentPrintersForOutlet(outletId: string): any[] {
  const printers: any[] = [];
  const agentIds = outletAgents.get(outletId);
  if (!agentIds) return printers;

  for (const agentId of agentIds) {
    const agentPrintersList = agentPrinters.get(agentId) || [];
    printers.push(...agentPrintersList);
  }
  return printers;
}

// ---------------------------------------------------------------------------
// WebSocket server
// ---------------------------------------------------------------------------

let wss: WebSocketServer | null = null;

export function createPrintAgentWebSocketServer(httpServer: HttpServer) {
  wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/print-agent',
  });

  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    const clientIP = req.socket.remoteAddress || 'unknown';
    console.log(`[print-agent] WebSocket connection from ${clientIP}`);

    // Set up ping/pong for keepalive
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (data: Buffer) => {
      let message: any;
      try {
        message = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        return;
      }

      switch (message.type) {
        case 'register': {
          // Authenticate using JWT token
          const token = message.token as string;
          if (!token) {
            ws.send(JSON.stringify({ type: 'error', message: 'Authentication token required' }));
            ws.close(4001, 'Authentication required');
            return;
          }

          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

            const user = await prisma.user.findUnique({
              where: { id: decoded.userId },
              select: {
                id: true,
                username: true,
                outletId: true,
                outletIds: true,
                tenantId: true,
                isSuperAdmin: true,
                isActive: true,
              },
            });

            if (!user || !user.isActive) {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid user' }));
              ws.close(4003, 'Invalid user');
              return;
            }

            const agentId = message.agentId || `${user.id}-${Date.now()}`;
            const outletId = message.outletId || user.outletId || '';
            const tenantId = user.tenantId || '';

            if (!outletId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Outlet ID required for agent registration' }));
              ws.close(4002, 'Outlet ID required');
              return;
            }

            const agentInfo: PrintAgentInfo = {
              agentId,
              tenantId,
              outletId,
              version: message.version || '1.0.0',
              platform: message.platform || 'unknown',
              hostname: message.hostname || 'unknown',
              connectedAt: new Date().toISOString(),
            };

            // Store agent
            agents.set(agentId, { ws, info: agentInfo, lastSeen: Date.now() });

            // Track by outlet
            if (!outletAgents.has(outletId)) {
              outletAgents.set(outletId, new Set());
            }
            outletAgents.get(outletId)!.add(agentId);

            // Attach agent info to the WebSocket for cleanup
            ws.agentId = agentId;
            ws.outletId = outletId;

            ws.send(JSON.stringify({ type: 'registered', agentId, outletId }));

            console.log(`[print-agent] Agent registered: ${agentId} (outlet: ${outletId})`);

            // Send any pending jobs for this outlet
            const pending = getPendingJobsForOutlet(outletId);
            for (const job of pending) {
              safeSend(ws, { type: 'print_job', job });
            }
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
            ws.close(4003, 'Authentication failed');
          }
          break;
        }

        case 'pong':
          // Heartbeat response
          if (ws.agentId) {
            const record = agents.get(ws.agentId);
            if (record) {
              record.lastSeen = Date.now();
            }
          }
          break;

        case 'print_result': {
          const result: PrintJobResult = message.result;
          if (result) {
            completePrintJob(result.jobId, result.status, result.error);
            console.log(`[print-agent] Job ${result.jobId}: ${result.status}`);
          }
          break;
        }

        case 'printer_update': {
          // Agent reports its detected printers
          const printers = message.printers || [];
          agentPrinters.set(ws.agentId || 'unknown', printers);
          break;
        }

        default:
          ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
      }
    });

    ws.on('close', () => {
      const agentId = ws.agentId;
      const outletId = ws.outletId;

      if (agentId) {
        agents.delete(agentId);
        agentPrinters.delete(agentId);
        console.log(`[print-agent] Agent disconnected: ${agentId}`);
      }

      if (outletId) {
        const agentSet = outletAgents.get(outletId);
        if (agentSet) {
          agentSet.delete(agentId!);
          if (agentSet.size === 0) {
            outletAgents.delete(outletId);
          }
        }
      }
    });

    ws.on('error', (err) => {
      console.error('[print-agent] WebSocket error:', err);
    });
  });

  // Heartbeat interval
  const heartbeatTimer = setInterval(() => {
    for (const [agentId, record] of agents) {
      if (record.ws.readyState === WebSocket.OPEN) {
        if (!record.ws.isAlive) {
          console.log(`[print-agent] Agent ${agentId} timed out, removing`);
          record.ws.terminate();
          agents.delete(agentId);
          agentPrinters.delete(agentId);
          const outletId = record.info.outletId;
          const agentSet = outletAgents.get(outletId);
          if (agentSet) {
            agentSet.delete(agentId);
            if (agentSet.size === 0) {
              outletAgents.delete(outletId);
            }
          }
        } else {
          record.ws.isAlive = false;
          record.ws.ping();
        }
      }
    }
  }, HEARTBEAT_INTERVAL);

  // Clean up on server close
  wss.on('close', () => {
    clearInterval(heartbeatTimer);
  });

  console.log('[print-agent] WebSocket server started on /ws/print-agent');
  return wss;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export function closePrintAgentWebSocketServer() {
  if (wss) {
    for (const client of wss.clients) {
      client.close();
    }
    wss.close();
    wss = null;
    agents.clear();
    outletAgents.clear();
    pendingJobs.clear();
    completedJobs.clear();
    agentPrinters.clear();
    console.log('[print-agent] WebSocket server closed');
  }
}
