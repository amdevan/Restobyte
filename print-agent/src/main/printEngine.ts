import * as net from 'net';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { DetectedPrinter, InterfaceType } from './printerManager';

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PrintJob {
  jobId: string;
  printerId: string;
  printerName: string;
  content: string;
  printType: 'test' | 'invoice' | 'kot' | 'bot' | 'delivery';
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

export interface PrintResult {
  jobId: string;
  status: 'completed' | 'failed';
  error?: string;
}

// ---------------------------------------------------------------------------
// ESC/POS Utilities
// ---------------------------------------------------------------------------

const ESC = '\x1B';
const GS = '\x1D';
const LF = '\x0A';
const CR = '\x0D';

/**
 * Ensure content has proper line endings for ESC/POS printers.
 * ESC/POS printers typically expect \n or \r\n.
 */
function normalizeContent(content: string): Buffer {
  // Convert to latin1 buffer to preserve ESC/POS escape sequences
  return Buffer.from(content, 'latin1');
}

/**
 * Send a reset command to initialize the printer.
 */
function getResetCommand(): Buffer {
  return Buffer.from(`${ESC}@`, 'latin1');
}

/**
 * Send a paper cut command (full cut).
 */
function getCutCommand(): Buffer {
  return Buffer.from(`${GS}V\x00`, 'latin1');
}

/**
 * Send a feed and cut command.
 */
function getFeedAndCut(lines: number = 5): Buffer {
  const safeLines = Math.max(1, Math.min(10, lines));
  return Buffer.from(`${ESC}d${String.fromCharCode(safeLines)}${GS}V\x00`, 'latin1');
}

// ---------------------------------------------------------------------------
// Print Methods
// ---------------------------------------------------------------------------

/**
 * Print to a network printer using raw TCP socket (port 9100).
 * This is the most common method for network thermal printers.
 */
async function printToNetworkPrinter(
  printer: DetectedPrinter,
  content: string,
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ipAddress = printer.ipAddress || '127.0.0.1';
    const port = printer.port || 9100;

    // Build the full print data with reset and cut commands
    const resetCmd = getResetCommand();
    const contentBuffer = normalizeContent(content);
    const cutCmd = getFeedAndCut(5);

    const printData = Buffer.concat([resetCmd, contentBuffer, cutCmd]);

    const socket = new net.Socket();
    const timeout = timeoutMs || 5000;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.write(printData, (err) => {
        if (err) {
          socket.destroy();
          reject(new Error(`Failed to write to printer: ${err.message}`));
          return;
        }
        // Wait a bit for the printer to process the data
        setTimeout(() => {
          socket.end();
          resolve();
        }, 500);
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Connection to printer ${ipAddress}:${port} timed out`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(new Error(`Network printer error: ${err.message}`));
    });

    socket.connect(port, ipAddress);
  });
}

/**
 * Print to a USB printer by writing directly to the device file.
 */
async function printToUSBPrinter(
  printer: DetectedPrinter,
  content: string,
  timeoutMs: number
): Promise<void> {
  const usbPath = printer.usbPath;
  if (!usbPath) {
    throw new Error('USB path not specified for USB printer');
  }

  // On Windows, USB paths are different
  if (process.platform === 'win32') {
    // On Windows, we can't write directly to USB devices
    // Fall back to system print commands
    return printViaSystemCommand(printer, content);
  }

  // On macOS/Linux, write directly to the device file
  const contentBuffer = normalizeContent(content);
  const resetCmd = getResetCommand();
  const cutCmd = getFeedAndCut(5);
  const printData = Buffer.concat([resetCmd, contentBuffer, cutCmd]);

  return new Promise((resolve, reject) => {
    const timeout = timeoutMs || 5000;

    // Check if the device exists
    if (!fs.existsSync(usbPath)) {
      // Try to find the device
      reject(new Error(`USB device not found at ${usbPath}`));
      return;
    }

    const fd = fs.openSync(usbPath, 'w');

    const timer = setTimeout(() => {
      fs.closeSync(fd);
      reject(new Error(`USB print timeout after ${timeout}ms`));
    }, timeout);

    fs.write(fd, printData, (err) => {
      clearTimeout(timer);
      if (err) {
        fs.closeSync(fd);
        reject(new Error(`Failed to write to USB printer: ${err.message}`));
        return;
      }
      fs.closeSync(fd);
      resolve();
    });
  });
}

/**
 * Print to a Bluetooth printer using RFCOMM.
 * Uses platform-specific commands to send data to a paired Bluetooth printer.
 */
async function printToBluetoothPrinter(
  printer: DetectedPrinter,
  content: string,
  timeoutMs: number
): Promise<void> {
  const mac = printer.bluetoothMac;
  if (!mac) {
    throw new Error('Bluetooth MAC address not specified');
  }

  const contentBuffer = normalizeContent(content);
  const resetCmd = getResetCommand();
  const cutCmd = getFeedAndCut(5);
  const printData = Buffer.concat([resetCmd, contentBuffer, cutCmd]);

  if (process.platform === 'win32') {
    // Windows: Use PowerShell to send to Bluetooth COM port
    const tempFile = path.join(os.tmpdir(), `restobyte-bt-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, printData);

    try {
      // Find the COM port associated with the Bluetooth MAC
      const { stdout } = await execAsync(
        `powershell -Command "Get-WmiObject Win32_SerialPort | Where-Object {$_.Name -like '*${mac}*'} | Select-Object -ExpandProperty DeviceID"`
      );
      const comPort = stdout.trim();
      if (comPort) {
        // Send to COM port using PowerShell
        await execAsync(
          `powershell -Command "Get-Content '${tempFile}' -Encoding Byte | Set-Content -Path '${comPort}' -Encoding Byte"`
        );
      }
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  } else if (process.platform === 'darwin') {
    // macOS: Use the Bluetooth serial port
    const tempFile = path.join(os.tmpdir(), `restobyte-bt-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, printData);

    try {
      // Find the RFCOMM device for the Bluetooth MAC
      const { stdout } = await execAsync(
        `system_profiler SPBluetoothDataType -json 2>/dev/null | grep -A5 "${mac}"`
      );
      // Try to find the device path
      const deviceMatch = stdout.match(/\/dev\/(cu\.|tty\.)[^\s]+/);
      const devicePath = deviceMatch ? deviceMatch[0] : `/dev/cu.${mac.replace(/:/g, '-')}`;

      if (fs.existsSync(devicePath)) {
        const fd = fs.openSync(devicePath, 'w');
        fs.writeSync(fd, printData);
        fs.closeSync(fd);
      } else {
        throw new Error(`Bluetooth serial device not found: ${devicePath}`);
      }
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  } else {
    // Linux: Use rfcomm
    const tempFile = path.join(os.tmpdir(), `restobyte-bt-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, printData);

    try {
      // Try to find the RFCOMM device
      const { stdout } = await execAsync(`ls /dev/rfcomm* 2>/dev/null`);
      const devicePath = stdout.trim().split('\n')[0];

      if (devicePath && fs.existsSync(devicePath)) {
        const fd = fs.openSync(devicePath, 'w');
        fs.writeSync(fd, printData);
        fs.closeSync(fd);
      } else {
        throw new Error('No Bluetooth RFCOMM device found');
      }
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
}

/**
 * Print to a serial printer using the serialport library.
 */
async function printToSerialPrinter(
  printer: DetectedPrinter,
  content: string,
  timeoutMs: number
): Promise<void> {
  const serialPort = printer.serialPort;
  if (!serialPort) {
    throw new Error('Serial port not specified');
  }

  const baudRate = printer.baudRate || 9600;
  const contentBuffer = normalizeContent(content);
  const resetCmd = getResetCommand();
  const cutCmd = getFeedAndCut(5);
  const printData = Buffer.concat([resetCmd, contentBuffer, cutCmd]);

  return new Promise((resolve, reject) => {
    const timeout = timeoutMs || 5000;
    let port: SerialPort | null = null;

    const timer = setTimeout(() => {
      if (port) {
        port.close();
      }
      reject(new Error(`Serial print timeout after ${timeout}ms`));
    }, timeout);

    try {
      port = new SerialPort({
        path: serialPort,
        baudRate: baudRate,
      });

      port.on('open', () => {
        port!.write(printData, (err) => {
          if (err) {
            clearTimeout(timer);
            port!.close();
            reject(new Error(`Failed to write to serial port: ${err.message}`));
            return;
          }
          // Wait for data to be flushed
          setTimeout(() => {
            clearTimeout(timer);
            port!.close();
            resolve();
          }, 500);
        });
      });

      port.on('error', (err) => {
        clearTimeout(timer);
        reject(new Error(`Serial port error: ${err.message}`));
      });
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

/**
 * Print using system print commands (lpr on macOS/Linux, PrintTo on Windows).
 * Used for standard (non-thermal) printers.
 */
async function printViaSystemCommand(
  printer: DetectedPrinter,
  content: string
): Promise<void> {
  const tempFile = path.join(os.tmpdir(), `restobyte-print-${Date.now()}.txt`);

  // Write content as latin1 to preserve ESC/POS commands
  fs.writeFileSync(tempFile, Buffer.from(content, 'latin1'));

  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      // Use lpr for macOS/Linux
      let printCommand = `lpr -l`;
      if (printer.name) {
        printCommand += ` -P "${printer.name}"`;
      }
      printCommand += ` "${tempFile}"`;

      await execAsync(printCommand);
    } else if (process.platform === 'win32') {
      // Use PowerShell for Windows
      const printerName = printer.name || 'PRN';
      const command = `powershell -Command "Start-Process -FilePath '${tempFile}' -Verb PrintTo -ArgumentList '${printerName}' -Wait"`;
      await execAsync(command);
    } else {
      throw new Error(`Unsupported platform for system printing: ${process.platform}`);
    }
  } finally {
    // Clean up temp file
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Print to a raw network printer (port 9100) without ESC/POS initialization.
 * Useful for printers that don't support reset commands.
 */
async function printRawToNetwork(
  ipAddress: string,
  port: number,
  data: Buffer,
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = timeoutMs || 5000;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.write(data, (err) => {
        if (err) {
          socket.destroy();
          reject(new Error(`Failed to write to printer: ${err.message}`));
          return;
        }
        setTimeout(() => {
          socket.end();
          resolve();
        }, 300);
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Connection to ${ipAddress}:${port} timed out`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(new Error(`Network printer error: ${err.message}`));
    });

    socket.connect(port, ipAddress);
  });
}

// ---------------------------------------------------------------------------
// Main Print Function
// ---------------------------------------------------------------------------

/**
 * Execute a print job on the specified printer.
 */
export async function executePrintJob(
  printer: DetectedPrinter,
  job: PrintJob
): Promise<PrintResult> {
  const timeoutMs = job.timeoutMs || printer.raw?.timeoutMs || 5000;
  const maxRetries = job.retries || printer.raw?.retries || 3;
  const content = job.content || '';

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const interfaceType = (printer.interfaceType || job.interfaceType || 'unknown') as InterfaceType;

      switch (interfaceType) {
        case 'network':
          if (printer.ipAddress) {
            // Try raw socket first (port 9100)
            await printToNetworkPrinter(printer, content, timeoutMs);
          } else {
            throw new Error('No IP address configured for network printer');
          }
          break;

        case 'usb':
          if (process.platform === 'win32') {
            // On Windows, use system print commands for USB
            await printViaSystemCommand(printer, content);
          } else {
            // On macOS/Linux, write directly to USB device
            await printToUSBPrinter(printer, content, timeoutMs);
          }
          break;

        case 'bluetooth':
          await printToBluetoothPrinter(printer, content, timeoutMs);
          break;

        case 'serial':
          await printToSerialPrinter(printer, content, timeoutMs);
          break;

        case 'parallel':
          // Use system print commands for parallel printers
          await printViaSystemCommand(printer, content);
          break;

        default:
          // Default to system print command
          await printViaSystemCommand(printer, content);
      }

      // Success
      return { jobId: job.jobId, status: 'completed' };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[print-engine] Print attempt ${attempt}/${maxRetries} failed for job ${job.jobId}:`, lastError.message);

      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  return {
    jobId: job.jobId,
    status: 'failed',
    error: lastError?.message || 'Unknown error after all retries',
  };
}

/**
 * Send a test print to verify the printer is working.
 */
export async function sendTestPrint(printer: DetectedPrinter): Promise<PrintResult> {
  const testContent = `
----------------------------------------
|        RESTOBYTE TEST PRINT          |
----------------------------------------
Date: ${new Date().toLocaleString()}

Printer: ${printer.name}
Type: ${printer.type}
Interface: ${printer.interfaceType}

Test print successful!
Thank you for using RestoByte!
`;

  const job: PrintJob = {
    jobId: `test-${Date.now()}`,
    printerId: printer.id,
    printerName: printer.name,
    content: testContent,
    printType: 'test',
    timestamp: new Date().toISOString(),
    outletId: '',
    tenantId: '',
  };

  return executePrintJob(printer, job);
}
