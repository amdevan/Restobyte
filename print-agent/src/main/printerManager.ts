import si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as net from 'net';

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrinterType = 'thermal' | 'network' | 'standard' | 'unknown';
export type InterfaceType = 'usb' | 'network' | 'bluetooth' | 'serial' | 'parallel' | 'unknown';

export interface DetectedPrinter {
  id: string;
  name: string;
  type: PrinterType;
  interfaceType: InterfaceType;
  isActive: boolean;
  ipAddress?: string;
  port?: number;
  usbPath?: string;
  bluetoothMac?: string;
  serialPort?: string;
  baudRate?: number;
  paperSize?: string;
  printerModel?: string;
  status: string;
  raw: any;
}

// ---------------------------------------------------------------------------
// Printer Detection
// ---------------------------------------------------------------------------

/**
 * Detect USB printers using platform-specific methods.
 */
async function detectUSBPrinters(): Promise<DetectedPrinter[]> {
  const printers: DetectedPrinter[] = [];

  try {
    if (process.platform === 'darwin') {
      // macOS: Use lpinfo to list USB printers
      try {
        const { stdout } = await execAsync('lpinfo -v 2>/dev/null');
        const lines = stdout.split('\n').filter(line =>
          line.toLowerCase().includes('usb:')
        );

        for (const line of lines) {
          const match = line.match(/usb:\/\/([^\s]+)/);
          if (match) {
            const uri = match[0];
            const parts = uri.replace('usb://', '').split('/');
            const name = parts.join(' ').trim() || `USB Printer (${uri})`;

            printers.push({
              id: `usb-${printers.length}`,
              name,
              type: 'thermal',
              interfaceType: 'usb',
              isActive: true,
              usbPath: uri,
              status: 'detected',
              raw: { uri, platform: 'darwin' },
            });
          }
        }
      } catch (e) {
        console.error('[printer-manager] macOS USB detection failed:', e);
      }
    } else if (process.platform === 'linux') {
      // Linux: Check /dev/usb/lp* and /dev/usb* for USB printers
      try {
        // Try lpinfo first
        const { stdout } = await execAsync('lpinfo -v 2>/dev/null');
        const lines = stdout.split('\n').filter(line =>
          line.toLowerCase().includes('usb:')
        );

        for (const line of lines) {
          const match = line.match(/usb:\/\/([^\s]+)/);
          if (match) {
            const uri = match[0];
            const name = uri.replace('usb://', '').replace(/\//g, ' ').trim() || `USB Printer (${uri})`;

            printers.push({
              id: `usb-${printers.length}`,
              name,
              type: 'thermal',
              interfaceType: 'usb',
              isActive: true,
              usbPath: uri,
              status: 'detected',
              raw: { uri, platform: 'linux' },
            });
          }
        }

        // Also check /dev/usb/ directory
        if (fs.existsSync('/dev/usb')) {
          const usbDevices = fs.readdirSync('/dev/usb').filter(f => f.startsWith('lp'));
          for (const device of usbDevices) {
            const devicePath = `/dev/usb/${device}`;
            if (!printers.some(p => p.usbPath === devicePath)) {
              printers.push({
                id: `usb-dev-${printers.length}`,
                name: `USB Printer (${devicePath})`,
                type: 'thermal',
                interfaceType: 'usb',
                isActive: true,
                usbPath: devicePath,
                status: 'detected',
                raw: { devicePath, platform: 'linux' },
              });
            }
          }
        }
      } catch (e) {
        console.error('[printer-manager] Linux USB detection failed:', e);
      }
    } else if (process.platform === 'win32') {
      // Windows: Use PowerShell to get USB printers
      try {
        const { stdout } = await execAsync(
          'powershell -Command "Get-Printer | Where-Object {$_.Type -eq \'Local\' -or $_.Type -eq \'USB\'} | Select-Object Name, DriverName, PortName, Type | ConvertTo-Json -Depth 3"'
        );

        const psPrinters = JSON.parse(stdout);
        const printerList = Array.isArray(psPrinters) ? psPrinters : [psPrinters];

        for (const p of printerList) {
          if (p.PortName?.toLowerCase().includes('usb')) {
            printers.push({
              id: `usb-${printers.length}`,
              name: p.Name,
              type: p.DriverName?.toLowerCase().includes('thermal') || p.DriverName?.toLowerCase().includes('esc') ? 'thermal' : 'standard',
              interfaceType: 'usb',
              isActive: true,
              usbPath: p.PortName,
              printerModel: p.DriverName,
              status: 'detected',
              raw: { name: p.Name, port: p.PortName, platform: 'win32' },
            });
          }
        }
      } catch (e) {
        console.error('[printer-manager] Windows USB detection failed:', e);
      }
    }
  } catch (error) {
    console.error('[printer-manager] USB printer detection error:', error);
  }

  return printers;
}

/**
 * Detect network printers (printers accessible via IP).
 */
async function detectNetworkPrinters(): Promise<DetectedPrinter[]> {
  const printers: DetectedPrinter[] = [];

  try {
    // Use systeminformation to get network printers
    const siPrinters = await si.printer();

    for (const printer of siPrinters) {
      const uri = printer.uri || '';
      const isNetworkPrinter = uri.startsWith('ipp://') ||
        uri.startsWith('http://') ||
        uri.startsWith('socket://') ||
        (printer.port && !uri.startsWith('usb:'));

      if (isNetworkPrinter) {
        const isThermal = printer.model?.toLowerCase().includes('thermal') ||
          printer.model?.toLowerCase().includes('esc') ||
          printer.model?.toLowerCase().includes('tm-') ||
          printer.model?.toLowerCase().includes('receipt') ||
          printer.model?.toLowerCase().includes('kitchen');

        // Extract IP and port from URI
        let ipAddress: string | undefined;
        let port: number | undefined;

        const socketMatch = uri.match(/socket:\/\/([^:]+):(\d+)/);
        const ippMatch = uri.match(/ipp:\/\/([^:]+):(\d+)/);
        const httpMatch = uri.match(/http:\/\/([^:]+):(\d+)/);

        const match = socketMatch || ippMatch || httpMatch;
        if (match) {
          ipAddress = match[1];
          port = parseInt(match[2], 10);
        }

        // Also check printer.port for IP:port format
        if (!ipAddress && printer.port) {
          const portMatch = printer.port.match(/(\d+\.\d+\.\d+\.\d+):(\d+)/);
          if (portMatch) {
            ipAddress = portMatch[1];
            port = parseInt(portMatch[2], 10);
          }
        }

        printers.push({
          id: `net-${printers.length}`,
          name: printer.name,
          type: isThermal ? 'thermal' : 'standard',
          interfaceType: 'network',
          isActive: true,
          ipAddress,
          port: port || 9100,
          printerModel: printer.model,
          status: printer.status || 'unknown',
          raw: { uri, ...printer, platform: process.platform },
        });
      }
    }
  } catch (error) {
    console.error('[printer-manager] Network printer detection error:', error);
  }

  // Also scan common network printer ports (port 9100)
  try {
    const localIp = await getLocalIp();
    const subnet = localIp ? localIp.substring(0, localIp.lastIndexOf('.')) : '192.168.1';

    // Scan a small range of IPs on port 9100 (common for thermal/network printers)
    // This is done in the background and may take a few seconds
    const scanResults = await scanNetworkPrinters(subnet, 9100, 50, 200);
    for (const ip of scanResults) {
      if (!printers.some(p => p.ipAddress === ip)) {
        printers.push({
          id: `netscan-${printers.length}`,
          name: `Network Printer (${ip})`,
          type: 'thermal',
          interfaceType: 'network',
          isActive: true,
          ipAddress: ip,
          port: 9100,
          status: 'detected',
          raw: { ipAddress: ip, port: 9100, platform: process.platform },
        });
      }
    }
  } catch (e) {
    // Network scanning is best-effort, don't fail if it doesn't work
  }

  return printers;
}

/**
 * Get the local IP address of this machine.
 */
async function getLocalIp(): Promise<string | null> {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

/**
 * Scan a subnet for devices listening on a specific port.
 */
function scanNetworkPrinters(
  subnet: string,
  port: number,
  maxScanned: number,
  timeoutMs: number
): Promise<string[]> {
  return new Promise((resolve) => {
    const results: string[] = [];
    let scanned = 0;

    for (let i = 1; i <= maxScanned && scanned < maxScanned; i++) {
      const ip = `${subnet}.${i}`;
      scanned++;

      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);

      socket.on('connect', () => {
        results.push(ip);
        socket.destroy();
      });

      socket.on('timeout', () => {
        socket.destroy();
      });

      socket.on('error', () => {
        socket.destroy();
      });

      socket.connect(port, ip);
    }

    // Wait for all scans to complete or timeout
    setTimeout(() => {
      resolve(results);
    }, timeoutMs + 200);
  });
}

/**
 * Detect Bluetooth printers.
 */
async function detectBluetoothPrinters(): Promise<DetectedPrinter[]> {
  const printers: DetectedPrinter[] = [];

  try {
    if (process.platform === 'darwin') {
      // macOS: Use system_profiler to list Bluetooth devices
      const { stdout } = await execAsync(
        'system_profiler SPBluetoothDataType -json 2>/dev/null'
      );
      const data = JSON.parse(stdout);
      const devices = data.SPPairedPeripherals_0 || [];

      for (const device of devices) {
        const name = device.deviceName || device.deviceProduct || 'Unknown Bluetooth Device';
        if (name.toLowerCase().includes('printer') ||
            name.toLowerCase().includes('bluetooth') ||
            name.toLowerCase().includes('thermal')) {
          printers.push({
            id: `bt-${printers.length}`,
            name,
            type: 'thermal',
            interfaceType: 'bluetooth',
            isActive: true,
            bluetoothMac: device.deviceAddress || device.deviceMACAddress,
            status: 'detected',
            raw: { device, platform: 'darwin' },
          });
        }
      }
    } else if (process.platform === 'linux') {
      // Linux: Use hcitool or bluetoothctl
      try {
        const { stdout } = await execAsync('hcitool con 2>/dev/null || bluetoothctl paired-devices 2>/dev/null');
        const lines = stdout.split('\n').filter(line => line.trim());

        for (const line of lines) {
          const match = line.match(/([0-9A-F:]{17})\s+(.+)/i);
          if (match) {
            const mac = match[1];
            const name = match[2];
            if (name.toLowerCase().includes('printer') || name.toLowerCase().includes('thermal')) {
              printers.push({
                id: `bt-${printers.length}`,
                name,
                type: 'thermal',
                interfaceType: 'bluetooth',
                isActive: true,
                bluetoothMac: mac,
                status: 'detected',
                raw: { mac, name, platform: 'linux' },
              });
            }
          }
        }
      } catch (e) {
        // hcitool not available
      }
    } else if (process.platform === 'win32') {
      // Windows: Use PowerShell to list paired Bluetooth devices
      try {
        const { stdout } = await execAsync(
          'powershell -Command "Get-PnpDevice -Class Bluetooth | Where-Object {$_.Status -eq \'OK\'} | Select-Object FriendlyName, InstanceId | ConvertTo-Json -Depth 3"'
        );
        const devices = JSON.parse(stdout);
        const deviceList = Array.isArray(devices) ? devices : [devices];

        for (const device of deviceList) {
          const name = device.FriendlyName || 'Unknown';
          if (name.toLowerCase().includes('printer') || name.toLowerCase().includes('thermal')) {
            printers.push({
              id: `bt-${printers.length}`,
              name,
              type: 'thermal',
              interfaceType: 'bluetooth',
              isActive: true,
              bluetoothMac: device.InstanceId,
              status: 'detected',
              raw: { device, platform: 'win32' },
            });
          }
        }
      } catch (e) {
        // PowerShell command failed
      }
    }
  } catch (error) {
    console.error('[printer-manager] Bluetooth printer detection error:', error);
  }

  return printers;
}

/**
 * Detect serial (COM/tty) printers.
 */
async function detectSerialPrinters(): Promise<DetectedPrinter[]> {
  const printers: DetectedPrinter[] = [];

  try {
    if (process.platform === 'win32') {
      // Windows: COM ports
      const { stdout } = await execAsync(
        'powershell -Command "Get-WmiObject Win32_SerialPort | Select-Object Name, DeviceID | ConvertTo-Json -Depth 3"'
      );
      const ports = JSON.parse(stdout);
      const portList = Array.isArray(ports) ? ports : [ports];

      for (const port of portList) {
        printers.push({
          id: `serial-${printers.length}`,
          name: port.Name || port.DeviceID || 'Serial Printer',
          type: 'thermal',
          interfaceType: 'serial',
          isActive: true,
          serialPort: port.DeviceID,
          baudRate: 9600,
          status: 'detected',
          raw: { port, platform: 'win32' },
        });
      }
    } else {
      // macOS/Linux: /dev/tty* and /dev/cu*
      const ttyPaths = [
        '/dev/tty.usbserial',
        '/dev/tty.usbmodem',
        '/dev/ttyUSB0',
        '/dev/ttyUSB1',
        '/dev/ttyACM0',
        '/dev/ttyS0',
        '/dev/ttyS1',
        '/dev/cu.usbserial',
        '/dev/cu.usbmodem',
      ];

      for (const ttyPath of ttyPaths) {
        if (fs.existsSync(ttyPath)) {
          printers.push({
            id: `serial-${printers.length}`,
            name: `Serial Printer (${ttyPath})`,
            type: 'thermal',
            interfaceType: 'serial',
            isActive: true,
            serialPort: ttyPath,
            baudRate: 9600,
            status: 'detected',
            raw: { serialPort: ttyPath, platform: process.platform },
          });
        }
      }
    }
  } catch (error) {
    console.error('[printer-manager] Serial printer detection error:', error);
  }

  return printers;
}

/**
 * Detect all printers on the system.
 */
export async function detectAllPrinters(): Promise<DetectedPrinter[]> {
  const printers: DetectedPrinter[] = [];

  try {
    // Use systeminformation for general printer detection
    const siPrinters = await si.printer();

    for (const printer of siPrinters) {
      const uri = printer.uri || '';
      const isUsb = uri.toLowerCase().startsWith('usb:') || uri.toLowerCase().startsWith('ippusb:');
      const isNetwork = uri.startsWith('ipp://') ||
        uri.startsWith('http://') ||
        uri.startsWith('socket://') ||
        (printer.port && !uri.startsWith('usb:'));

      const isThermal = printer.model?.toLowerCase().includes('thermal') ||
        printer.model?.toLowerCase().includes('esc') ||
        printer.model?.toLowerCase().includes('tm-') ||
        printer.model?.toLowerCase().includes('receipt') ||
        printer.model?.toLowerCase().includes('kitchen') ||
        printer.model?.toLowerCase().includes('pos');

      let interfaceType: InterfaceType = 'unknown';
      let ipAddress: string | undefined;
      let port: number | undefined;
      let usbPath: string | undefined;

      if (isUsb) {
        interfaceType = 'usb';
        usbPath = uri;
      } else if (isNetwork) {
        interfaceType = 'network';
        const socketMatch = uri.match(/socket:\/\/([^:]+):(\d+)/);
        const ippMatch = uri.match(/ipp:\/\/([^:]+):(\d+)/);
        const httpMatch = uri.match(/http:\/\/([^:]+):(\d+)/);
        const match = socketMatch || ippMatch || httpMatch;
        if (match) {
          ipAddress = match[1];
          port = parseInt(match[2], 10);
        }
        if (!ipAddress && printer.port) {
          const portMatch = printer.port.match(/(\d+\.\d+\.\d+\.\d+):(\d+)/);
          if (portMatch) {
            ipAddress = portMatch[1];
            port = parseInt(portMatch[2], 10);
          }
        }
      }

      printers.push({
        id: `si-${printers.length}`,
        name: printer.name,
        type: isThermal ? 'thermal' : 'standard',
        interfaceType,
        isActive: true,
        ipAddress,
        port: port || 9100,
        usbPath,
        printerModel: printer.model,
        status: printer.status || 'unknown',
        raw: { ...printer, platform: process.platform },
      });
    }
  } catch (error) {
    console.error('[printer-manager] systeminformation detection error:', error);
  }

  // Detect USB printers specifically
  const usbPrinters = await detectUSBPrinters();
  for (const p of usbPrinters) {
    if (!printers.some(existing => existing.usbPath === p.usbPath && existing.interfaceType === 'usb')) {
      printers.push(p);
    }
  }

  // Detect Bluetooth printers
  const btPrinters = await detectBluetoothPrinters();
  for (const p of btPrinters) {
    if (!printers.some(existing => existing.bluetoothMac === p.bluetoothMac)) {
      printers.push(p);
    }
  }

  // Detect Serial printers
  const serialPrinters = await detectSerialPrinters();
  for (const p of serialPrinters) {
    if (!printers.some(existing => existing.serialPort === p.serialPort)) {
      printers.push(p);
    }
  }

  return printers;
}

/**
 * Detect network printers by scanning the local subnet.
 */
export async function scanForNetworkPrinters(): Promise<DetectedPrinter[]> {
  return detectNetworkPrinters();
}
