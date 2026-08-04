// QZ Tray integration for browser-based printing
// QZ Tray desktop app must be installed on the user's computer

const QZ_CDN_URL = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2/qz-tray.js';

interface QzApi {
  setPromiseType(promiser: <T>(resolver: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void) => Promise<T>): void;
}

interface QzSecurity {
  setCertificatePromise(promiseHandler: (() => Promise<string> | string) | Promise<string>): void;
  setSignaturePromise(promiseFactory: (dataToSign: string) => Promise<string> | string): void;
}

interface QzWebsocket {
  isActive(): boolean;
  connect(options?: Record<string, unknown>): Promise<void>;
  disconnect(): Promise<void>;
}

interface QzPrinters {
  find(query?: string): Promise<string[]>;
}

interface QzConfigs {
  create(printer: string, options?: Record<string, unknown>): Record<string, unknown>;
}

interface QzPrintData {
  type?: string;
  format?: string;
  flavor?: string;
  data: string;
  options?: Record<string, unknown>;
}

interface QzModule {
  api: QzApi;
  security: QzSecurity;
  websocket: QzWebsocket;
  printers: QzPrinters;
  configs: QzConfigs;
  print(config: Record<string, unknown>, data: Array<QzPrintData | string>): Promise<void>;
}

declare global {
  interface Window {
    qz?: QzModule;
  }
}

let qzInstance: QzModule | null = null;
let isConfigured = false;
let isLoading = false;
let loadPromise: Promise<QzModule> | null = null;

/**
 * Load QZ Tray library from CDN dynamically
 */
async function loadQzFromCdn(): Promise<QzModule> {
  if (window.qz) {
    return window.qz;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = new Promise<QzModule>((resolve, reject) => {
    // Check if already loaded
    if (window.qz) {
      isLoading = false;
      resolve(window.qz);
      return;
    }

    const script = document.createElement('script');
    script.src = QZ_CDN_URL;
    script.async = true;

    script.onload = () => {
      isLoading = false;
      if (window.qz) {
        resolve(window.qz);
      } else {
        reject(new Error('QZ Tray loaded but qz object not found'));
      }
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load QZ Tray from CDN. Make sure QZ Tray desktop app is installed.'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Get the QZ Tray instance, loading from CDN if needed
 */
async function getQzInstance(): Promise<QzModule> {
  if (qzInstance) {
    return qzInstance;
  }

  // Try to load from CDN
  qzInstance = await loadQzFromCdn();
  return qzInstance;
}

/**
 * Configure QZ Tray with required settings
 */
const configureQz = async () => {
  if (isConfigured) {
    return;
  }

  const qz = await getQzInstance();
  qz.api.setPromiseType((resolver) => new Promise(resolver));
  qz.security.setCertificatePromise(() => Promise.resolve(''));
  qz.security.setSignaturePromise(() => Promise.resolve(''));
  isConfigured = true;
};

/**
 * Ensure QZ Tray is connected to the desktop app
 */
const ensureConnected = async () => {
  const qz = await getQzInstance();
  await configureQz();

  if (qz.websocket.isActive()) {
    return;
  }

  await qz.websocket.connect();
};

/**
 * Detect all printers available through QZ Tray
 */
export const detectQzTrayPrinters = async (): Promise<string[]> => {
  try {
    const qz = await getQzInstance();
    await ensureConnected();
    const printers = await qz.printers.find();
    return Array.isArray(printers) ? printers : [];
  } catch (error) {
    console.error('QZ Tray detection error:', error);
    throw new Error(
      'QZ Tray not available. Please install QZ Tray from https://qz.io/download and ensure it is running.'
    );
  }
};

/**
 * Print raw content via QZ Tray
 */
export const printRawViaQzTray = async (printerName: string, content: string): Promise<void> => {
  const normalizedPrinterName = printerName.trim();
  if (!normalizedPrinterName) {
    throw new Error('QZ Tray printer name is required.');
  }

  const qz = await getQzInstance();
  await ensureConnected();

  const config = qz.configs.create(normalizedPrinterName, {
    encoding: 'ISO-8859-1',
    copies: 1,
    altPrinting: false,
    jobName: 'RestoByte Print Job',
  });

  await qz.print(config, [
    {
      type: 'raw',
      format: 'command',
      flavor: 'plain',
      data: content,
    },
  ]);
};

/**
 * Check if QZ Tray is available
 */
export const isQzTrayAvailable = async (): Promise<boolean> => {
  try {
    const qz = await getQzInstance();
    return qz.websocket.isActive();
  } catch {
    return false;
  }
};
