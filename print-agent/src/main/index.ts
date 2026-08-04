import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as net from 'net';
import WebSocket from 'ws';
import axios from 'axios';
import si from 'systeminformation';
import { detectAllPrinters, scanForNetworkPrinters, DetectedPrinter } from './printerManager';
import { executePrintJob, sendTestPrint, PrintJob, PrintResult } from './printEngine';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const AGENT_VERSION = '1.0.0';
const DEFAULT_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const WS_URL = process.env.WS_URL || 'ws://localhost:3000/ws/print-agent';
const AGENT_PORT = parseInt(process.env.AGENT_PORT || '3010', 10);
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '10000', 10); // 10 seconds
const MAX_RECONNECT_ATTEMPTS = 100; // Unlimited in practice
const RECONNECT_DELAY = 5000;
const HEARTBEAT_INTERVAL = 30000;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let pollTimer: NodeJS.Timeout | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;

let backendUrl: string = DEFAULT_BACKEND_URL;
let wsUrl: string = WS_URL;
let authToken: string | null = null;
let outletId: string | null = null;
let tenantId: string | null = null;
let agentId: string | null = null;

let detectedPrinters: DetectedPrinter[] = [];
let isDetecting = false;
let isConnected = false;
let connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function getAgentId(): string {
  if (agentId) return agentId;
  const hostname = os.hostname();
  const platform = process.platform;
  const id = `agent-${hostname}-${platform}-${Date.now()}`;
  agentId = id;
  return id;
}

function getPlatformInfo(): string {
  return `${os.platform()} ${os.release()} (${os.arch()})`;
}

function getHostname(): string {
  return os.hostname();
}

function log(message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [print-agent] ${message}`, ...args);
}

function logError(message: string, ...args: any[]) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [print-agent] ERROR: ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// IPC Handlers (Renderer <-> Main)
// ---------------------------------------------------------------------------

ipcMain.handle('agent:get-info', () => {
  return {
    version: AGENT_VERSION,
    platform: getPlatformInfo(),
    hostname: getHostname(),
    backendUrl,
    outletId,
    tenantId,
    isConnected,
    connectionStatus,
    isDetecting,
    printers: detectedPrinters,
  };
});

ipcMain.handle('agent:set-config', async (_event, config: { backendUrl?: string; wsUrl?: string; token?: string; outletId?: string; tenantId?: string }) => {
  if (config.backendUrl) backendUrl = config.backendUrl;
  if (config.wsUrl) wsUrl = config.wsUrl;
  if (config.token) authToken = config.token;
  if (config.outletId) outletId = config.outletId;
  if (config.tenantId) tenantId = config.tenantId;

  // Save config to file
  saveConfig();

  // Reconnect with new config
  if (ws) {
    ws.close();
  }
  connectWebSocket();

  return { success: true };
});

ipcMain.handle('agent:connect', async () => {
  if (ws) {
    ws.close();
  }
  connectWebSocket();
  return { success: true };
});

ipcMain.handle('agent:disconnect', async () => {
  if (ws) {
    ws.close();
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  isConnected = false;
  connectionStatus = 'disconnected';
  updateTrayMenu();
  return { success: true };
});

ipcMain.handle('agent:detect-printers', async () => {
  if (isDetecting) {
    return { printers: detectedPrinters, isDetecting: true };
  }

  isDetecting = true;
  updateTrayMenu();
  updateWindow();

  try {
    detectedPrinters = await detectAllPrinters();
    log(`Detected ${detectedPrinters.length} printers`);

    // Also scan for network printers
    const networkPrinters = await scanForNetworkPrinters();
    for (const np of networkPrinters) {
      if (!detectedPrinters.some(p => p.ipAddress === np.ipAddress)) {
        detectedPrinters.push(np);
      }
    }

    // Report printers to backend via WebSocket or REST
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'printer_update',
        printers: detectedPrinters,
      }));
    }
  } catch (err) {
    logError('Printer detection failed:', err);
  } finally {
    isDetecting = false;
    updateTrayMenu();
    updateWindow();
  }

  return { printers: detectedPrinters, isDetecting: false };
});

ipcMain.handle('agent:print-test', async (_event, printerId: string) => {
  const printer = detectedPrinters.find(p => p.id === printerId);
  if (!printer) {
    return { success: false, error: 'Printer not found' };
  }

  try {
    const result = await sendTestPrint(printer);
    return { success: result.status === 'completed', result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
});

ipcMain.handle('agent:get-system-info', async () => {
  const [cpu, mem, osInfo, printerInfo] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.osInfo(),
    si.printer(),
  ]);

  return {
    cpu: {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      cores: cpu.cores,
      speed: cpu.speed,
    },
    memory: {
      total: mem.total,
      used: mem.used,
      free: mem.free,
    },
    os: {
      platform: osInfo.platform,
      distro: osInfo.distro,
      release: osInfo.release,
      arch: osInfo.arch,
    },
    printers: printerInfo,
  };
});

// ---------------------------------------------------------------------------
// WebSocket Connection
// ---------------------------------------------------------------------------

function connectWebSocket() {
  if (!backendUrl || !outletId) {
    logError('Cannot connect: backendUrl or outletId not configured');
    connectionStatus = 'error';
    updateTrayMenu();
    updateWindow();
    return;
  }

  // Convert HTTP URL to WebSocket URL
  let wsEndpoint = wsUrl;
  if (!wsEndpoint.startsWith('ws://') && !wsEndpoint.startsWith('wss://')) {
    const httpUrl = new URL(backendUrl);
    wsEndpoint = httpUrl.protocol === 'https:'
      ? `wss://${httpUrl.host}/ws/print-agent`
      : `ws://${httpUrl.host}/ws/print-agent`;
  }

  connectionStatus = 'connecting';
  isConnected = false;
  updateTrayMenu();
  updateWindow();

  log(`Connecting to WebSocket: ${wsEndpoint}`);

  try {
    ws = new WebSocket(wsEndpoint);

    ws.on('open', () => {
      log('WebSocket connection opened');
      reconnectAttempts = 0;
      connectionStatus = 'connected';
      isConnected = true;
      updateTrayMenu();
      updateWindow();

      // Register the agent
      const registerMessage = {
        type: 'register',
        token: authToken,
        agentId: getAgentId(),
        outletId: outletId,
        version: AGENT_VERSION,
        platform: getPlatformInfo(),
        hostname: getHostname(),
      };

      ws.send(JSON.stringify(registerMessage));

      // Start heartbeat
      startHeartbeat();

      // Start REST fallback polling
      startPolling();

      // Detect printers on connect
      detectPrintersAndReport();
    });

    ws.on('message', (data: Buffer) => {
      let message: any;
      try {
        message = JSON.parse(data.toString());
      } catch (err) {
        logError('Failed to parse WebSocket message:', err);
        return;
      }

      handleWebSocketMessage(message);
    });

    ws.on('close', (code: number, reason: Buffer) => {
      log(`WebSocket connection closed (code: ${code}, reason: ${reason.toString()})`);
      isConnected = false;
      connectionStatus = 'disconnected';
      updateTrayMenu();
      updateWindow();

      // Stop heartbeat and polling
      stopHeartbeat();
      stopPolling();

      // Attempt reconnection
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(RECONNECT_DELAY * reconnectAttempts, 30000);
        log(`Reconnecting in ${delay / 1000} seconds (attempt ${reconnectAttempts})...`);

        reconnectTimer = setTimeout(() => {
          connectWebSocket();
        }, delay);
      }
    });

    ws.on('error', (err) => {
      logError('WebSocket error:', err.message);
      connectionStatus = 'error';
      updateTrayMenu();
      updateWindow();
    });
  } catch (err) {
    logError('Failed to create WebSocket connection:', err);
    connectionStatus = 'error';
    updateTrayMenu();
    updateWindow();
  }
}

function handleWebSocketMessage(message: any) {
  switch (message.type) {
    case 'registered':
      log(`Agent registered successfully (agentId: ${message.agentId}, outletId: ${message.outletId})`);
      break;

    case 'print_job':
      log(`Received print job: ${message.job.jobId} (type: ${message.job.printType})`);
      handlePrintJob(message.job);
      break;

    case 'pong':
      // Heartbeat response
      break;

    case 'error':
      logError('WebSocket error from server:', message.message);
      break;

    default:
      log(`Unknown WebSocket message type: ${message.type}`);
  }
}

// ---------------------------------------------------------------------------
// Print Job Handling
// ---------------------------------------------------------------------------

async function handlePrintJob(job: PrintJob) {
  log(`Processing print job: ${job.jobId}`);

  // Find the printer
  let printer = detectedPrinters.find(p => p.id === job.printerId);

  if (!printer) {
    // Try to find by name
    printer = detectedPrinters.find(p => p.name === job.printerName);
  }

  if (!printer) {
    // Create a printer object from the job data
    printer = {
      id: job.printerId,
      name: job.printerName,
      type: 'unknown',
      interfaceType: (job.interfaceType || 'network') as any,
      isActive: true,
      ipAddress: job.ipAddress,
      port: job.port ? parseInt(job.port, 10) : undefined,
      usbPath: job.usbPath,
      bluetoothMac: job.bluetoothMac,
      serialPort: job.serialPort,
      baudRate: job.baudRate,
      paperSize: job.paperSize,
      printerModel: job.printerName,
      status: 'configured',
      raw: {},
    };
  }

  try {
    const result = await executePrintJob(printer, job);

    // Send result back via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'print_result',
        result: {
          jobId: job.jobId,
          status: result.status,
          error: result.error,
        },
      }));
    }

    // Also report via REST API
    if (authToken && backendUrl) {
      try {
        await axios.post(
          `${backendUrl}/api/print-agent/jobs/${job.jobId}/complete`,
          { status: result.status, error: result.error },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } catch (err) {
        logError('Failed to report print result via REST:', err);
      }
    }

    // Show notification
    if (result.status === 'completed') {
      showNotification('Print Job Completed', `Job ${job.jobId} printed successfully`);
    } else {
      showNotification('Print Job Failed', `Job ${job.jobId}: ${result.error || 'Unknown error'}`);
    }

    log(`Print job ${job.jobId}: ${result.status}`);
  } catch (err) {
    logError(`Failed to process print job ${job.jobId}:`, err);

    const result: PrintResult = {
      jobId: job.jobId,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'print_result',
        result,
      }));
    }

    showNotification('Print Job Failed', `Job ${job.jobId}: ${result.error}`);
  }
}

// ---------------------------------------------------------------------------
// REST API Fallback Polling
// ---------------------------------------------------------------------------

function startPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
  }

  pollTimer = setInterval(async () => {
    if (!authToken || !backendUrl || !outletId) return;

    try {
      const response = await axios.get(
        `${backendUrl}/api/print-agent/jobs?outletId=${encodeURIComponent(outletId)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const jobs = response.data?.jobs || [];
      for (const job of jobs) {
        log(`Picked up print job via REST fallback: ${job.jobId}`);
        await handlePrintJob(job);
      }
    } catch (err) {
      // Silently ignore polling errors (will retry on next interval)
      if (err instanceof Error && err.message.includes('401')) {
        logError('REST polling authentication failed, please re-authenticate');
      }
    }
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Heartbeat
// ---------------------------------------------------------------------------

function startHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }

  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'pong' }));
    }
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Printer Detection
// ---------------------------------------------------------------------------

async function detectPrintersAndReport() {
  try {
    detectedPrinters = await detectAllPrinters();
    log(`Detected ${detectedPrinters.length} printers`);

    // Report to backend
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'printer_update',
        printers: detectedPrinters,
      }));
    }
  } catch (err) {
    logError('Printer detection failed:', err);
  }

  updateWindow();
}

// ---------------------------------------------------------------------------
// Config Persistence
// ---------------------------------------------------------------------------

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function saveConfig() {
  try {
    const config = {
      backendUrl,
      wsUrl,
      outletId,
      tenantId,
      agentId: getAgentId(),
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    log('Configuration saved');
  } catch (err) {
    logError('Failed to save config:', err);
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      backendUrl = config.backendUrl || DEFAULT_BACKEND_URL;
      wsUrl = config.wsUrl || WS_URL;
      outletId = config.outletId || null;
      tenantId = config.tenantId || null;
      agentId = config.agentId || null;
      authToken = config.authToken || null;
      log('Configuration loaded');
    }
  } catch (err) {
    logError('Failed to load config:', err);
  }
}

// ---------------------------------------------------------------------------
// Window Management
// ---------------------------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 800,
    minHeight: 500,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
    title: 'RestoByte Print Agent',
    icon: path.join(__dirname, '../../assets/icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

  mainWindow.on('show', () => {
    updateWindow();
  });

  mainWindow.on('hide', () => {
    // Keep running in tray
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  let trayIcon: nativeImage;

  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.fromFile(iconPath);
  } else {
    // Create a simple placeholder icon (16x16)
    trayIcon = nativeImage.fromSize(16, 16);
    const ctx = trayIcon.getContext();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('R', 3, 12);
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('RestoByte Print Agent');
  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });

  tray.on('right-click', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      if (!mainWindow) {
        createWindow();
      }
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;

  const statusText = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    error: 'Error',
  }[connectionStatus];

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `RestoByte Print Agent v${AGENT_VERSION}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `Status: ${statusText}`,
      enabled: false,
    },
    {
      label: `Printers: ${detectedPrinters.length}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click: () => {
        if (!mainWindow) {
          createWindow();
        }
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Detect Printers',
      click: () => {
        detectPrintersAndReport();
      },
    },
    {
      label: 'Reconnect',
      click: () => {
        if (ws) ws.close();
        connectWebSocket();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function updateWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.webContents.send('agent:status-update', {
      version: AGENT_VERSION,
      platform: getPlatformInfo(),
      hostname: getHostname(),
      backendUrl,
      outletId,
      tenantId,
      isConnected,
      connectionStatus,
      isDetecting,
      printers: detectedPrinters,
    });
  }
}

function showNotification(title: string, body: string) {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
}

// ---------------------------------------------------------------------------
// App Lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  loadConfig();
  createWindow();
  createTray();

  // Auto-detect printers on startup
  setTimeout(() => {
    detectPrintersAndReport();
  }, 1000);

  // Auto-connect if config exists
  if (backendUrl && outletId) {
    setTimeout(() => {
      connectWebSocket();
    }, 2000);
  }
});

app.on('window-all-closed', () => {
  // Keep the app running in the tray
  // On macOS, this is the standard behavior
  // On Windows/Linux, we keep running because of the tray icon
});

app.on('before-quit', () => {
  if (ws) {
    ws.close();
  }
  stopHeartbeat();
  stopPolling();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
});

// Handle app activation (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});
