import { Request, Response } from 'express';
import si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import prisma from '../db/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const execAsync = promisify(exec);

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

export const getSystemPrinters = async (req: Request, res: Response) => {
  try {
    const [printers, usbDetails] = await Promise.all([
      si.printer(),
      getUSBPrinterDetails()
    ]);

    // Enhance printer info with USB details and map to frontend expected fields
    const enhancedPrinters = printers.map((printer: any) => {
      // Check if printer URI is USB to auto-set usbPath
      const isUsbPrinter = printer.uri?.toLowerCase().startsWith('usb:') || printer.uri?.toLowerCase().startsWith('ippusb:');
      let matchingUsb = usbDetails.find(
        (usb: any) => 
          (printer.name && usb.name && printer.name.toLowerCase().includes(usb.name.toLowerCase())) ||
          (usb.name && printer.name?.toLowerCase().includes(usb.name?.toLowerCase()))
      );
      
      return {
        name: printer.name,
        model: printer.model,
        status: printer.status,
        port: printer.uri,
        usbPath: isUsbPrinter ? printer.uri : (matchingUsb?.path || matchingUsb?.uri),
        uri: printer.uri,
        raw: printer
      };
    });

    res.status(200).json({ printers: enhancedPrinters });
  } catch (error) {
    console.error('Error fetching system printers:', error);
    res.status(500).json({
      message: 'Failed to fetch system printers',
      error: error instanceof Error ? error.message : String(error)
    });
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
    const queryOutletId = typeof (req.query as any)?.outletId === 'string' ? String((req.query as any).outletId) : undefined;
    const requestedOutletId = queryOutletId || (user.outletId ? String(user.outletId) : undefined);
    if (!requestedOutletId) {
      res.status(400).json({ message: 'outletId is required' });
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

    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `restobyte-print-${Date.now()}.txt`);
    
    fs.writeFileSync(tempFilePath, printContent, 'utf8');

    let printCommand = '';
    
    // Determine print command based on OS and printer type
    if (process.platform === 'darwin' || process.platform === 'linux') {
      // First get list of available printers to find a match
      let systemPrinters: string[] = [];
      try {
        const { stdout } = await execAsync('lpstat -p');
        systemPrinters = stdout.split('\n')
          .filter(line => line.trim().startsWith('printer '))
          .map(line => line.split(' ')[1]);
      } catch (e) {
        console.error('Failed to get system printers:', e);
      }

      let printerToUse = printer.name;
      
      // Try to find a matching printer in the system list
      if (systemPrinters.length > 0) {
        const normalizedDbName = printer.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const matchingPrinter = systemPrinters.find(sp => {
          const normalizedSystemName = sp.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return normalizedSystemName.includes(normalizedDbName) || normalizedDbName.includes(normalizedSystemName);
        });
        if (matchingPrinter) {
          printerToUse = matchingPrinter;
        }
      }

      // macOS or Linux: use lpr
      if (printerToUse) {
        printCommand = `lpr -P "${printerToUse}" "${tempFilePath}"`;
      } else {
        printCommand = `lpr "${tempFilePath}"`;
      }
    } else if (process.platform === 'win32') {
      // Windows: use print command or PowerShell
      if (printer.name) {
        printCommand = `powershell -Command "Out-File -FilePath '${tempFilePath}' -Encoding utf8; Start-Process -FilePath '${tempFilePath}' -Verb PrintTo -ArgumentList '${printer.name}'"`;
      } else {
        printCommand = `print /D:"PRN" "${tempFilePath}"`;
      }
    }

    if (printCommand) {
      await execAsync(printCommand);
    }

    // Clean up temp file only after the print command has completed
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (e) {
      console.error('Error cleaning up temp print file:', e);
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
