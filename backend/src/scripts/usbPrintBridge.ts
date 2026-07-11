import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';

const execAsync = promisify(exec);
const VERSION = '1.0.0';

const API_BASE_URL = (process.env.RESTOBYTE_API_URL || '').replace(/\/+$/, '');
const OUTLET_ID = process.env.RESTOBYTE_OUTLET_ID || '';
const BRIDGE_TOKEN = process.env.RESTOBYTE_BRIDGE_TOKEN || '';
const POLL_INTERVAL_MS = Number(process.env.RESTOBYTE_BRIDGE_POLL_MS || 2500);
const HEARTBEAT_INTERVAL_MS = Number(process.env.RESTOBYTE_BRIDGE_HEARTBEAT_MS || 15000);

if (!API_BASE_URL || !OUTLET_ID || !BRIDGE_TOKEN) {
  console.error('Missing required env vars. Please set RESTOBYTE_API_URL, RESTOBYTE_OUTLET_ID, and RESTOBYTE_BRIDGE_TOKEN.');
  process.exit(1);
}

type ClaimResponse = {
  job: null | {
    id: string;
    printerId: string;
    printerName: string;
    printType: string;
    content: string;
    timeoutMs?: number;
    maxRetries?: number;
    attempts?: number;
  };
  printer?: {
    id: string;
    name: string;
    usbPath?: string | null;
    paperSize?: string | null;
    printerModel?: string | null;
    timeoutMs?: number | null;
    retries?: number | null;
  } | null;
};

let stopped = false;
let lastError = '';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePrinterName(value?: string | null) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function getLocalPrinters(): Promise<string[]> {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      const { stdout } = await execAsync('lpstat -p');
      return stdout
        .split('\n')
        .filter(line => line.trim().startsWith('printer '))
        .map(line => line.split(' ')[1])
        .filter((name): name is string => Boolean(name));
    }

    if (process.platform === 'win32') {
      const { stdout } = await execAsync(
        'powershell -Command "Get-Printer | Select-Object -ExpandProperty Name | ConvertTo-Json"'
      );
      const parsed = JSON.parse(stdout || '[]');
      return Array.isArray(parsed) ? parsed.map((value) => String(value)) : (parsed ? [String(parsed)] : []);
    }
  } catch (error) {
    console.error('Failed to detect local printers:', error);
  }

  return [];
}

async function printViaSystemPrinter(printerName: string, content: string): Promise<void> {
  const tempFilePath = path.join(os.tmpdir(), `restobyte-usb-bridge-${Date.now()}.txt`);

  try {
    fs.writeFileSync(tempFilePath, Buffer.from(content, 'latin1'));

    let printCommand = '';
    if (process.platform === 'darwin' || process.platform === 'linux') {
      let printerToUse = printerName;
      const localPrinters = await getLocalPrinters();
      if (localPrinters.length > 0) {
        const normalizedRequested = normalizePrinterName(printerName);
        const match = localPrinters.find((item) => {
          const normalizedLocal = normalizePrinterName(item);
          return normalizedLocal.includes(normalizedRequested) || normalizedRequested.includes(normalizedLocal);
        });
        if (match) {
          printerToUse = match;
        }
      }

      printCommand = printerToUse
        ? `lpr -l -P "${printerToUse}" "${tempFilePath}"`
        : `lpr -l "${tempFilePath}"`;
    } else if (process.platform === 'win32') {
      printCommand = printerName
        ? `powershell -Command "Out-File -FilePath '${tempFilePath}' -Encoding utf8; Start-Process -FilePath '${tempFilePath}' -Verb PrintTo -ArgumentList '${printerName}'"`
        : `print /D:"PRN" "${tempFilePath}"`;
    } else {
      throw new Error(`Unsupported platform: ${process.platform}`);
    }

    await execAsync(printCommand);
  } finally {
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (error) {
      console.error('Failed to clean temp print file:', error);
    }
  }
}

async function postJson<T>(pathname: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bridge-token': BRIDGE_TOKEN
    },
    body: JSON.stringify({
      outletId: OUTLET_ID,
      bridgeClientId: `usb-bridge-${os.hostname()}`,
      ...body
    })
  });

  if (!response.ok) {
    throw new Error(`Bridge API failed (${response.status}): ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

async function sendHeartbeat() {
  const printers = await getLocalPrinters();
  await postJson('/api/printers/bridge/heartbeat', {
    host: os.hostname(),
    version: VERSION,
    printers,
    lastError: lastError || undefined
  });
}

async function processOneJob(): Promise<boolean> {
  const payload = await postJson<ClaimResponse>('/api/printers/bridge/jobs/claim', {
    host: os.hostname(),
    version: VERSION
  });

  if (!payload.job) {
    return false;
  }

  const printerName = payload.printer?.name || payload.job.printerName;
  try {
    await printViaSystemPrinter(printerName, payload.job.content);
    await postJson(`/api/printers/bridge/jobs/${payload.job.id}/complete`, {});
    lastError = '';
    console.log(`[usb-bridge] Printed job ${payload.job.id} on ${printerName}`);
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    console.error(`[usb-bridge] Failed job ${payload.job.id}:`, lastError);
    await postJson(`/api/printers/bridge/jobs/${payload.job.id}/fail`, {
      error: lastError
    });
  }

  return true;
}

async function run() {
  console.log('[usb-bridge] Starting RestoByte USB print bridge');
  console.log(`[usb-bridge] API: ${API_BASE_URL}`);
  console.log(`[usb-bridge] Outlet: ${OUTLET_ID}`);
  console.log(`[usb-bridge] Host: ${os.hostname()}`);

  let nextHeartbeatAt = 0;

  while (!stopped) {
    try {
      if (Date.now() >= nextHeartbeatAt) {
        await sendHeartbeat();
        nextHeartbeatAt = Date.now() + HEARTBEAT_INTERVAL_MS;
      }

      const handledJob = await processOneJob();
      if (!handledJob) {
        await sleep(POLL_INTERVAL_MS);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error('[usb-bridge] Loop error:', lastError);
      await sleep(Math.max(POLL_INTERVAL_MS, 3000));
    }
  }
}

process.on('SIGINT', () => {
  stopped = true;
});

process.on('SIGTERM', () => {
  stopped = true;
});

run().catch((error) => {
  console.error('[usb-bridge] Fatal error:', error);
  process.exit(1);
});
