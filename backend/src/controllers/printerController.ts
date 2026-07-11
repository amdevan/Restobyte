import { Request, Response } from 'express';
import si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import crypto from 'crypto';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const execAsync = promisify(exec);

type DetectedPrinter = {
  name: string;
  model?: string;
  status?: string;
  port?: string;
  usbPath?: string;
  uri?: string;
  raw?: any;
  sources?: string[];
};

const NETWORK_INTERFACE_TYPE = 'Network (IP/Ethernet)';
const USB_INTERFACE_TYPE = 'USB';
const USB_BRIDGE_APPDATA_KEY = 'usb_print_bridge';
const STALE_PROCESSING_JOB_MS = 2 * 60 * 1000;

type UsbBridgeConfig = {
  tokenHash?: string;
  tokenPreview?: string;
  createdAt?: string;
  rotatedAt?: string;
  lastHeartbeatAt?: string;
  lastHost?: string;
  lastVersion?: string;
  lastSeenPrinters?: string[];
  lastError?: string;
};

function hashBridgeToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateBridgeToken(): string {
  return `rb_usb_${crypto.randomBytes(24).toString('hex')}`;
}

function buildTokenPreview(token: string): string {
  return `${token.slice(0, 10)}...${token.slice(-6)}`;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function getAccessibleOutletIds(user: NonNullable<AuthRequest['user']>) {
  if (user.isSuperAdmin) return null;
  if (user.roleId === 'role-admin') {
    if (!user.tenantId) return [];
    const outlets = await prisma.outlet.findMany({
      where: { tenantId: user.tenantId },
      select: { id: true }
    });
    return outlets.map((outlet) => outlet.id);
  }

  return Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
    ? (user as any).outletIds.map(String)
    : (user.outletId ? [String(user.outletId)] : []);
}

async function ensureUserCanAccessOutlet(user: NonNullable<AuthRequest['user']>, outletId?: string | null): Promise<boolean> {
  if (!outletId) return false;
  const allowedOutletIds = await getAccessibleOutletIds(user);
  return allowedOutletIds === null || allowedOutletIds.includes(String(outletId));
}

function getRequestedOutletId(req: Request, fallbackOutletId?: string | null): string | undefined {
  const queryOutletId = typeof (req.query as any)?.outletId === 'string'
    ? String((req.query as any).outletId)
    : undefined;
  const bodyOutletId = typeof req.body?.outletId === 'string'
    ? String(req.body.outletId)
    : undefined;
  return queryOutletId || bodyOutletId || (fallbackOutletId ? String(fallbackOutletId) : undefined);
}

async function getUsbBridgeConfig(outletId: string): Promise<UsbBridgeConfig> {
  const record = await prisma.outletAppData.findUnique({
    where: { outletId_key: { outletId, key: USB_BRIDGE_APPDATA_KEY } }
  });

  return isObjectRecord(record?.data) ? (record?.data as UsbBridgeConfig) : {};
}

async function saveUsbBridgeConfig(outletId: string, config: UsbBridgeConfig) {
  await prisma.outletAppData.upsert({
    where: { outletId_key: { outletId, key: USB_BRIDGE_APPDATA_KEY } },
    update: { data: config as any },
    create: { outletId, key: USB_BRIDGE_APPDATA_KEY, data: config as any }
  });
}

function sanitizePrintContent(content: string): string {
  return String(content || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\x00-\x1F\x20-\x7E]/g, '')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '\n');
}

async function printViaSystemPrinter(printerName: string, content: string): Promise<void> {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `restobyte-print-${Date.now()}.txt`);

  try {
    fs.writeFileSync(tempFilePath, Buffer.from(content, 'latin1'));

    let printCommand = '';
    if (process.platform === 'darwin' || process.platform === 'linux') {
      let printerToUse = printerName;
      try {
        const { stdout } = await execAsync('lpstat -p');
        const systemPrinters = stdout.split('\n')
          .filter(line => line.trim().startsWith('printer '))
          .map(line => line.split(' ')[1])
          .filter((name): name is string => Boolean(name));

        if (systemPrinters.length > 0) {
          const normalizedDbName = normalizePrinterName(printerName);
          const matchingPrinter = systemPrinters.find(sp => {
            const normalizedSystemName = normalizePrinterName(sp);
            return normalizedSystemName.includes(normalizedDbName) || normalizedDbName.includes(normalizedSystemName);
          });
          if (matchingPrinter) {
            printerToUse = matchingPrinter;
          }
        }
      } catch (error) {
        console.error('Failed to get system printers:', error);
      }

      printCommand = printerToUse
        ? `lpr -l -P "${printerToUse}" "${tempFilePath}"`
        : `lpr -l "${tempFilePath}"`;
    } else if (process.platform === 'win32') {
      printCommand = printerName
        ? `powershell -Command "Out-File -FilePath '${tempFilePath}' -Encoding utf8; Start-Process -FilePath '${tempFilePath}' -Verb PrintTo -ArgumentList '${printerName}'"`
        : `print /D:"PRN" "${tempFilePath}"`;
    }

    if (!printCommand) {
      throw new Error(`Unsupported platform for local printing: ${process.platform}`);
    }

    await execAsync(printCommand);
  } finally {
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp print file:', error);
    }
  }
}

async function enqueueUsbPrintJob(printer: any, outletId: string, printType: string, content: string) {
  return prisma.printerJob.create({
    data: {
      printerId: String(printer.id),
      outletId,
      printerName: String(printer.name || ''),
      interfaceType: String(printer.interfaceType || USB_INTERFACE_TYPE),
      printType: String(printType || 'raw'),
      content,
      maxRetries: Number(printer.retries || 3),
      timeoutMs: Number(printer.timeoutMs || 5000)
    }
  });
}

async function authenticateUsbBridgeRequest(req: Request): Promise<{ outletId: string; config: UsbBridgeConfig }> {
  const outletId = getRequestedOutletId(req);
  const token = req.header('x-bridge-token') || req.body?.token;

  if (!outletId) {
    throw new Error('outletId is required');
  }
  if (!token || typeof token !== 'string') {
    throw new Error('Bridge token is required');
  }

  const config = await getUsbBridgeConfig(outletId);
  if (!config.tokenHash || config.tokenHash !== hashBridgeToken(token)) {
    throw new Error('Invalid bridge token');
  }

  return { outletId, config };
}

function normalizePrinterName(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function mergePrinterRecord(map: Map<string, DetectedPrinter>, printer: DetectedPrinter, source: string) {
  const key = normalizePrinterName(printer.name);
  if (!key) return;

  const existing = map.get(key);
  if (!existing) {
    const initialRecord: DetectedPrinter = {
      ...printer,
      sources: [source]
    };
    map.set(key, initialRecord);
    return;
  }

  const mergedRecord: DetectedPrinter = {
    name: existing.name || printer.name,
    raw: existing.raw || printer.raw,
    sources: Array.from(new Set([...(existing.sources || []), source]))
  };

  const mergedModel = existing.model || printer.model;
  const mergedStatus = existing.status || printer.status;
  const mergedPort = existing.port || printer.port;
  const mergedUsbPath = existing.usbPath || printer.usbPath;
  const mergedUri = existing.uri || printer.uri;

  if (mergedModel) mergedRecord.model = mergedModel;
  if (mergedStatus) mergedRecord.status = mergedStatus;
  if (mergedPort) mergedRecord.port = mergedPort;
  if (mergedUsbPath) mergedRecord.usbPath = mergedUsbPath;
  if (mergedUri) mergedRecord.uri = mergedUri;

  map.set(key, mergedRecord);
}

async function getCommandStdout(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command);
    return stdout || '';
  } catch (error) {
    console.error(`Command failed: ${command}`, error);
    return '';
  }
}

async function getCupsPrinterDetails(): Promise<DetectedPrinter[]> {
  if (process.platform !== 'darwin' && process.platform !== 'linux') {
    return [];
  }

  const [printerStatusOutput, printerDeviceOutput] = await Promise.all([
    getCommandStdout('lpstat -p'),
    getCommandStdout('lpstat -v')
  ]);

  const printersByName = new Map<string, DetectedPrinter>();

  printerStatusOutput
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('printer '))
    .forEach(line => {
      const match = line.match(/^printer\s+(.+?)\s+(is .+)$/i);
      if (!match) return;

      const name = match[1]?.trim();
      const status = match[2]?.trim();
      if (!name || !status) return;
      mergePrinterRecord(printersByName, { name, status }, 'lpstat');
    });

  printerDeviceOutput
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const match = line.match(/^device for (.+?):\s+(.+)$/i);
      if (!match) return;

      const name = match[1]?.trim();
      const uri = match[2]?.trim();
      if (!name || !uri) return;
      const isUsbPrinter = uri.toLowerCase().startsWith('usb:') || uri.toLowerCase().startsWith('ippusb:');
      const detectedPrinter: DetectedPrinter = {
        name,
        port: uri,
        uri
      };
      if (isUsbPrinter) {
        detectedPrinter.usbPath = uri;
      }
      mergePrinterRecord(printersByName, detectedPrinter, 'cups_device');
    });

  return Array.from(printersByName.values());
}

async function getUSBPrinterDetails(): Promise<any[]> {
  const usbPrinters: any[] = [];
  
  // Try platform-specific commands for better USB details
  try {
    if (process.platform === 'darwin') {
      // macOS: use lpinfo to list printers with device URIs
      const { stdout } = await execAsync('lpinfo -v');
      const usbLines = stdout.split('\n').filter(line => line.toLowerCase().includes('usb:'));
      usbLines.forEach(line => {
        const match = line.match(/usb:\/\/([^\s]+)/);
        if (match) {
          usbPrinters.push({
            type: 'USB',
            uri: match[0],
            path: match[0],
            raw: line
          });
        }
      });
    } else if (process.platform === 'linux') {
      // Linux: check /dev/usb/lp* or use lpinfo
      try {
        const { stdout } = await execAsync('lpinfo -v');
        const usbLines = stdout.split('\n').filter(line => line.toLowerCase().includes('usb:'));
        usbLines.forEach(line => {
          const match = line.match(/usb:\/\/([^\s]+)/);
          if (match) {
            usbPrinters.push({
              type: 'USB',
              uri: match[0],
              path: match[0],
              raw: line
            });
          }
        });
      } catch (e) {
        // Fallback to lsusb
        try {
          const { stdout } = await execAsync('lsusb');
          usbPrinters.push({ type: 'USB', raw: stdout });
        } catch (_) {}
      }
    } else if (process.platform === 'win32') {
      // Windows: use PowerShell to get USB printers
      try {
        const { stdout } = await execAsync(
          'powershell -Command "Get-Printer | Where-Object {$_.Type -eq \'Local\' -or $_.Type -eq \'USB\'} | Select-Object Name, DriverName, PortName | ConvertTo-Json"'
        );
        const printers = JSON.parse(stdout);
        printers.forEach((p: any) => {
          if (p.PortName?.toLowerCase().includes('usb')) {
            usbPrinters.push({
              type: 'USB',
              name: p.Name,
              path: p.PortName,
              model: p.DriverName,
              raw: p
            });
          }
        });
      } catch (e) {}
    }
  } catch (error) {
    console.error('Error getting USB printer details:', error);
  }
  
  return usbPrinters;
}

async function printToNetworkPrinter(ipAddress: string, port: string | number, content: string, timeoutMs = 5000): Promise<void> {
  const portNumber = Number(port);
  if (!Number.isFinite(portNumber) || portNumber <= 0) {
    throw new Error('Invalid printer port configured for network printer');
  }

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: ipAddress, port: portNumber });
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.removeAllListeners();
      socket.destroy();
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      socket.write(Buffer.from(content, 'latin1'), (writeError) => {
        if (writeError) {
          finish(writeError);
          return;
        }
        socket.end();
      });
    });

    socket.once('timeout', () => finish(new Error(`Network printer connection timed out after ${timeoutMs}ms`)));
    socket.once('error', (error) => finish(error));
    socket.once('close', (hadError) => {
      if (!hadError) {
        finish();
      }
    });
  });
}

export const getSystemPrinters = async (_req: Request, res: Response) => {
  try {
    const [printers, usbDetails, cupsPrinters] = await Promise.all([
      si.printer(),
      getUSBPrinterDetails(),
      getCupsPrinterDetails()
    ]);

    const mergedPrinters = new Map<string, DetectedPrinter>();

    // Enhance printer info with USB details and map to frontend expected fields.
    printers.forEach((printer: any) => {
      // Check if printer URI is USB to auto-set usbPath
      const isUsbPrinter = printer.uri?.toLowerCase().startsWith('usb:') || printer.uri?.toLowerCase().startsWith('ippusb:');
      const matchingUsb = usbDetails.find(
        (usb: any) => 
          (printer.name && usb.name && printer.name.toLowerCase().includes(usb.name.toLowerCase())) ||
          (usb.name && printer.name?.toLowerCase().includes(usb.name?.toLowerCase()))
      );

      mergePrinterRecord(mergedPrinters, {
        name: printer.name,
        model: printer.model,
        status: printer.status,
        port: printer.uri,
        usbPath: isUsbPrinter ? printer.uri : (matchingUsb?.path || matchingUsb?.uri),
        uri: printer.uri,
        raw: printer
      }, 'systeminformation');
    });

    cupsPrinters.forEach(printer => mergePrinterRecord(mergedPrinters, printer, 'cups'));

    const enhancedPrinters = Array.from(mergedPrinters.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(printer => ({
        name: printer.name,
        model: printer.model,
        status: printer.status,
        port: printer.port,
        usbPath: printer.usbPath,
        uri: printer.uri,
        raw: printer.raw,
        sources: printer.sources
      }));

    const detectionMessage = enhancedPrinters.length === 0
      ? 'Printer detection checks the machine where the backend is running. On a hosted live server, local POS printers usually will not appear unless that server is on the same machine or local network as the printer.'
      : undefined;

    res.status(200).json({
      printers: enhancedPrinters,
      detectionHost: os.hostname(),
      platform: process.platform,
      message: detectionMessage
    });
  } catch (error) {
    console.error('Error fetching system printers:', error);
    res.status(500).json({
      message: 'Failed to fetch system printers',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const getUsbBridgeSetup = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const requestedOutletId = getRequestedOutletId(req, user.outletId);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (!(await ensureUserCanAccessOutlet(user, requestedOutletId))) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const [config, pendingJobs, usbPrinters] = await Promise.all([
    getUsbBridgeConfig(requestedOutletId),
    prisma.printerJob.count({
      where: {
        outletId: requestedOutletId,
        interfaceType: USB_INTERFACE_TYPE,
        status: 'pending'
      }
    }),
    prisma.printer.findMany({
      where: {
        outletId: requestedOutletId,
        interfaceType: USB_INTERFACE_TYPE,
        isActive: true
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, usbPath: true, printerModel: true }
    })
  ]);

  res.json({
    outletId: requestedOutletId,
    configured: Boolean(config.tokenHash),
    tokenPreview: config.tokenPreview || null,
    createdAt: config.createdAt || null,
    rotatedAt: config.rotatedAt || null,
    lastHeartbeatAt: config.lastHeartbeatAt || null,
    lastHost: config.lastHost || null,
    lastVersion: config.lastVersion || null,
    lastSeenPrinters: Array.isArray(config.lastSeenPrinters) ? config.lastSeenPrinters : [],
    lastError: config.lastError || null,
    pendingJobs,
    usbPrinters
  });
};

export const rotateUsbBridgeToken = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const requestedOutletId = getRequestedOutletId(req, user.outletId);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (!(await ensureUserCanAccessOutlet(user, requestedOutletId))) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }

  const nowIso = new Date().toISOString();
  const bridgeToken = generateBridgeToken();
  const existingConfig = await getUsbBridgeConfig(requestedOutletId);
  const nextConfig: UsbBridgeConfig = {
    ...existingConfig,
    tokenHash: hashBridgeToken(bridgeToken),
    tokenPreview: buildTokenPreview(bridgeToken),
    createdAt: existingConfig.createdAt || nowIso,
    rotatedAt: nowIso
  };

  await saveUsbBridgeConfig(requestedOutletId, nextConfig);

  res.json({
    outletId: requestedOutletId,
    token: bridgeToken,
    tokenPreview: nextConfig.tokenPreview || null,
    rotatedAt: nowIso
  });
};

export const bridgeHeartbeat = async (req: Request, res: Response) => {
  try {
    const { outletId, config } = await authenticateUsbBridgeRequest(req);
    const printers = Array.isArray(req.body?.printers)
      ? req.body.printers.map((value: unknown) => String(value)).filter(Boolean).slice(0, 50)
      : [];

    const nextConfig: UsbBridgeConfig = {
      ...config,
      lastHeartbeatAt: new Date().toISOString(),
      lastHost: typeof req.body?.host === 'string' ? req.body.host : config.lastHost,
      lastVersion: typeof req.body?.version === 'string' ? req.body.version : config.lastVersion,
      lastSeenPrinters: printers,
      lastError: typeof req.body?.lastError === 'string' ? req.body.lastError : undefined
    };
    if (!nextConfig.lastError && config.lastError) {
      delete nextConfig.lastError;
    }

    await saveUsbBridgeConfig(outletId, nextConfig);
    res.json({ ok: true, outletId, serverTime: new Date().toISOString() });
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : 'Unauthorized' });
  }
};

export const claimUsbBridgeJob = async (req: Request, res: Response) => {
  try {
    const { outletId } = await authenticateUsbBridgeRequest(req);
    const bridgeClientId = typeof req.body?.bridgeClientId === 'string' && req.body.bridgeClientId.trim()
      ? req.body.bridgeClientId.trim()
      : `bridge-${os.hostname()}`;
    const staleBefore = new Date(Date.now() - STALE_PROCESSING_JOB_MS);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const candidate = await prisma.printerJob.findFirst({
        where: {
          outletId,
          interfaceType: USB_INTERFACE_TYPE,
          OR: [
            { status: 'pending' },
            { status: 'processing', claimedAt: { lt: staleBefore } }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });

      if (!candidate) {
        res.json({ job: null });
        return;
      }

      const updateResult = await prisma.printerJob.updateMany({
        where: {
          id: candidate.id,
          updatedAt: candidate.updatedAt
        },
        data: {
          status: 'processing',
          claimedAt: new Date(),
          claimedBy: bridgeClientId,
          errorMessage: null
        }
      });

      if (updateResult.count === 0) {
        continue;
      }

      const printer = await prisma.printer.findFirst({
        where: { id: candidate.printerId, outletId },
        select: {
          id: true,
          name: true,
          usbPath: true,
          paperSize: true,
          printerModel: true,
          timeoutMs: true,
          retries: true
        }
      });

      res.json({
        job: {
          id: candidate.id,
          printerId: candidate.printerId,
          printerName: candidate.printerName,
          printType: candidate.printType,
          content: candidate.content,
          timeoutMs: candidate.timeoutMs,
          maxRetries: candidate.maxRetries,
          attempts: candidate.attempts
        },
        printer
      });
      return;
    }

    res.json({ job: null });
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : 'Unauthorized' });
  }
};

export const completeUsbBridgeJob = async (req: Request, res: Response) => {
  try {
    const { outletId, config } = await authenticateUsbBridgeRequest(req);
    const jobId = typeof req.params.id === 'string' ? req.params.id : '';
    if (!jobId) {
      res.status(400).json({ message: 'job id is required' });
      return;
    }

    await prisma.printerJob.updateMany({
      where: { id: jobId, outletId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        errorMessage: null
      }
    });

    if (config.lastError) {
      const nextConfig: UsbBridgeConfig = { ...config };
      delete nextConfig.lastError;
      await saveUsbBridgeConfig(outletId, nextConfig);
    }

    res.json({ ok: true, jobId });
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : 'Unauthorized' });
  }
};

export const failUsbBridgeJob = async (req: Request, res: Response) => {
  try {
    const { outletId, config } = await authenticateUsbBridgeRequest(req);
    const jobId = typeof req.params.id === 'string' ? req.params.id : '';
    if (!jobId) {
      res.status(400).json({ message: 'job id is required' });
      return;
    }

    const errorMessage = typeof req.body?.error === 'string' ? req.body.error.slice(0, 500) : 'USB bridge failed to print';
    const job = await prisma.printerJob.findFirst({
      where: { id: jobId, outletId }
    });

    if (!job) {
      res.status(404).json({ message: 'Print job not found' });
      return;
    }

    const nextAttempts = Number(job.attempts || 0) + 1;
    const shouldFailPermanently = nextAttempts >= Number(job.maxRetries || 1);

    await prisma.printerJob.update({
      where: { id: jobId },
      data: {
        attempts: nextAttempts,
        status: shouldFailPermanently ? 'failed' : 'pending',
        failedAt: shouldFailPermanently ? new Date() : null,
        claimedAt: null,
        claimedBy: null,
        errorMessage
      }
    });

    await saveUsbBridgeConfig(outletId, {
      ...config,
      lastHeartbeatAt: new Date().toISOString(),
      lastError: errorMessage
    });

    res.json({
      ok: true,
      jobId,
      status: shouldFailPermanently ? 'failed' : 'pending',
      attempts: nextAttempts
    });
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : 'Unauthorized' });
  }
};

export const getPrinters = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
  const requestedOutletId = queryOutletId || (user?.outletId ? String(user.outletId) : undefined);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (user && !user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (user.tenantId) {
        const outlet = await prisma.outlet.findFirst({ where: { id: requestedOutletId, tenantId: user.tenantId } });
        if (!outlet) {
          res.status(403).json({ message: 'Unauthorized' });
          return;
        }
      }
    } else {
      const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
        ? (user as any).outletIds.map(String)
        : (user.outletId ? [String(user.outletId)] : []);
      if (!allowedOutletIds.includes(requestedOutletId)) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
  }
  const printers = await prisma.printer.findMany({ 
    where: { outletId: requestedOutletId },
    orderBy: { name: 'asc' } 
  });
  res.json(printers);
};

export const createPrinter = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
  const requestedOutletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (!user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (!user.tenantId) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
      const outlet = await prisma.outlet.findFirst({ where: { id: requestedOutletId, tenantId: user.tenantId } });
      if (!outlet) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    } else {
      const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
        ? (user as any).outletIds.map(String)
        : (user.outletId ? [String(user.outletId)] : []);
      if (!allowedOutletIds.includes(requestedOutletId)) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
  }
  const { name, type, interfaceType, isActive, ipAddress, port, usbPath, bluetoothMac, serialPort, baudRate, paperSize, printerModel, timeoutMs, retries, autoPrintReceipt, autoPrintKOT, autoPrintLabel, notes } = req.body;
  const printer = await prisma.printer.create({ 
    data: { 
      name,
      type,
      interfaceType,
      isActive,
      ipAddress,
      port,
      usbPath,
      bluetoothMac,
      serialPort,
      baudRate,
      paperSize,
      printerModel,
      timeoutMs,
      retries,
      autoPrintReceipt,
      autoPrintKOT,
      autoPrintLabel,
      notes,
      outletId: requestedOutletId
    } 
  });
  res.status(201).json(printer);
};

export const updatePrinter = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
  const requestedOutletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (user && !user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (user.tenantId) {
        const outlet = await prisma.outlet.findFirst({ where: { id: requestedOutletId, tenantId: user.tenantId } });
        if (!outlet) {
          res.status(403).json({ message: 'Unauthorized' });
          return;
        }
      }
    } else {
      const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
        ? (user as any).outletIds.map(String)
        : (user.outletId ? [String(user.outletId)] : []);
      if (!allowedOutletIds.includes(requestedOutletId)) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
  }
  const id = req.params.id as string;
  const { name, type, interfaceType, isActive, ipAddress, port, usbPath, bluetoothMac, serialPort, baudRate, paperSize, printerModel, timeoutMs, retries, autoPrintReceipt, autoPrintKOT, autoPrintLabel, notes } = req.body;
  
  const existingPrinter = await prisma.printer.findFirst({
    where: { id, outletId: requestedOutletId }
  });
  
  if (!existingPrinter) {
    res.status(404).json({ message: 'Printer not found or unauthorized' });
    return;
  }

  const printer = await prisma.printer.update({ 
    where: { id }, 
    data: { 
      name,
      type,
      interfaceType,
      isActive,
      ipAddress,
      port,
      usbPath,
      bluetoothMac,
      serialPort,
      baudRate,
      paperSize,
      printerModel,
      timeoutMs,
      retries,
      autoPrintReceipt,
      autoPrintKOT,
      autoPrintLabel,
      notes
    } 
  });
  res.json(printer);
};

export const deletePrinter = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    res.status(403).json({ message: 'Unauthorized' });
    return;
  }
  const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
  const requestedOutletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);
  if (!requestedOutletId) {
    res.status(400).json({ message: 'outletId is required' });
    return;
  }
  if (!user.isSuperAdmin) {
    if (user.roleId === 'role-admin') {
      if (!user.tenantId) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
      const outlet = await prisma.outlet.findFirst({ where: { id: requestedOutletId, tenantId: user.tenantId } });
      if (!outlet) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    } else {
      const allowedOutletIds = Array.isArray((user as any).outletIds) && (user as any).outletIds.length > 0
        ? (user as any).outletIds.map(String)
        : (user.outletId ? [String(user.outletId)] : []);
      if (!allowedOutletIds.includes(requestedOutletId)) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
    }
  }
  const id = req.params.id as string;
  
  const existingPrinter = await prisma.printer.findFirst({
    where: { id, outletId: requestedOutletId }
  });
  
  if (!existingPrinter) {
    res.status(404).json({ message: 'Printer not found or unauthorized' });
    return;
  }

  await prisma.printer.delete({ where: { id } });
  res.status(204).send();
};

export const printDocument = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const { printerId, content, printType } = req.body;
    const requestedOutletId = getRequestedOutletId(req, user.outletId);
    if (!requestedOutletId) {
      res.status(400).json({ message: 'outletId is required' });
      return;
    }
    if (!(await ensureUserCanAccessOutlet(user, requestedOutletId))) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    // Get printer from database
    const printer = await prisma.printer.findFirst({
      where: { id: printerId, outletId: requestedOutletId }
    });

    if (!printer) {
      res.status(404).json({ message: 'Printer not found or unauthorized' });
      return;
    }

    // Generate print content if not provided
    let printContent = content;
    if (!printContent) {
      if (printType === 'test') {
        printContent = `
----------------------------------------
|        RESTOBYTE TEST PRINT          |
----------------------------------------
Date: ${new Date().toLocaleString()}

Printer: ${printer.name}
Type: ${printer.type}
Interface: ${printer.interfaceType}

Thank you for using RestoByte!
`;
      } else if (printType === 'invoice') {
        printContent = `
----------------------------------------
|          RESTOBYTE INVOICE           |
----------------------------------------
Date: ${new Date().toLocaleString()}

This is a sample invoice.
`;
      } else if (printType === 'kot') {
        printContent = `
----------------------------------------
|     RESTOBYTE KITCHEN ORDER TICKET   |
----------------------------------------
Date: ${new Date().toLocaleString()}

This is a sample KOT.
`;
      }
    }

    // Keep direct thermal jobs raw-friendly so ESC/POS emphasis commands survive.
    printContent = sanitizePrintContent(printContent || '');

    if (printer.interfaceType === USB_INTERFACE_TYPE) {
      const bridgeConfig = await getUsbBridgeConfig(requestedOutletId);
      if (bridgeConfig.tokenHash) {
        const job = await enqueueUsbPrintJob(printer, requestedOutletId, String(printType || 'raw'), printContent);
        res.status(202).json({
          message: 'USB print job queued for the local bridge',
          printer: printer.name,
          queued: true,
          jobId: job.id
        });
        return;
      }
    }

    if (printer.interfaceType === NETWORK_INTERFACE_TYPE && printer.ipAddress && printer.port) {
      await printToNetworkPrinter(
        printer.ipAddress,
        printer.port,
        printContent,
        Number(printer.timeoutMs || 5000)
      );
    } else {
      await printViaSystemPrinter(String(printer.name || ''), printContent);
    }

    res.status(200).json({ 
      message: 'Print job sent successfully',
      printer: printer.name 
    });
  } catch (error) {
    console.error('Error printing:', error);
    res.status(500).json({
      message: 'Failed to print',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
