import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { isAdminLike } from '../utils/roleUtils.js';
import type { Express } from 'express';

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const ALGORITHM = 'aes-256-gcm';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getDbUrl(): string {
  return process.env.DATABASE_URL || '';
}

function parseDbUrl(url: string) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Invalid DATABASE_URL');
  return { user: match[1], password: match[2], host: match[3], port: match[4], database: (match[5] || '').split('?')[0] };
}

function generateChecksum(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function encryptFile(inputPath: string, outputPath: string, password: string): void {
  const key = crypto.scryptSync(password, 'salt-backup-v1', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const input = fs.readFileSync(inputPath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(16) + tag(16) + encrypted
  fs.writeFileSync(outputPath, Buffer.concat([iv, tag, encrypted]));
}

function decryptFile(inputPath: string, password: string): Buffer {
  const key = crypto.scryptSync(password, 'salt-backup-v1', 32);
  const data = fs.readFileSync(inputPath);
  const iv = data.subarray(0, 16);
  const tag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

async function runPgDump(dbUrl: string, outputPath: string, tables?: string[]): Promise<void> {
  const db = parseDbUrl(dbUrl);
  let cmd = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} --no-owner --no-acl -F c`;
  if (tables && tables.length > 0) {
    for (const t of tables) cmd += ` -t ${t}`;
  }
  cmd += ` -f "${outputPath}"`;
  await execAsync(cmd, { env: { ...process.env, PGPASSWORD: db.password }, maxBuffer: 50 * 1024 * 1024 });
}

async function runPgRestore(dbUrl: string, backupPath: string, tables?: string[]): Promise<void> {
  const db = parseDbUrl(dbUrl);
  let cmd = `pg_restore -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} --no-owner --no-acl --clean --if-exists`;
  if (tables && tables.length > 0) {
    for (const t of tables) cmd += ` -t ${t}`;
  }
  cmd += ` "${backupPath}"`;
  await execAsync(cmd, { env: { ...process.env, PGPASSWORD: db.password }, maxBuffer: 50 * 1024 * 1024 });
}

const TABLE_MAP: Record<string, string[]> = {
  database: ['Order', 'OrderItem', 'Customer', 'Invoice', 'PaymentHistory', 'Outlet', 'MenuItem', 'Category', 'Variation', 'Table', 'User', 'Role', 'Printer', 'Reservation', 'Tenant', 'Currency', 'PlanDefinition', 'Payment', 'SubscriptionInvoice', 'TenantLoginHistory', 'OutletAppData', 'UserAppData', 'GlobalAppData'],
  products: ['MenuItem', 'Category', 'Variation'],
  customers: ['Customer'],
  inventory: ['OutletAppData'],
  sales: ['Order', 'OrderItem', 'Invoice', 'PaymentHistory'],
  settings: ['Outlet', 'Printer', 'Role', 'Currency', 'PlanDefinition', 'OutletAppData', 'GlobalAppData'],
  employees: ['User', 'OutletAppData'],
};

// ── Create Backup ──
export const createBackup = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!isAdminLike(user) || !user) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { type = 'full', password, label } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);
    const dbUrl = getDbUrl();
    const tables = type === 'full' ? undefined : TABLE_MAP[type];

    if (type !== 'full' && !tables) {
      res.status(400).json({ message: `Invalid backup type: ${type}` });
      return;
    }

    // Run pg_dump
    await runPgDump(dbUrl, filePath, tables);

    const stats = fs.statSync(filePath);
    let finalPath = filePath;
    let finalFilename = filename;
    let encrypted = false;

    // Encrypt if password provided
    if (password) {
      const encPath = filePath + '.enc';
      encryptFile(filePath, encPath, password);
      fs.unlinkSync(filePath);
      finalPath = encPath;
      finalFilename = filename + '.enc';
      encrypted = true;
    }

    const checksum = generateChecksum(finalPath);
    const finalStats = fs.statSync(finalPath);

    // Save to database
    const backup = await prisma.backupHistory.create({
      data: {
        filename: finalFilename,
        type,
        label: label || `${type} backup`,
        sizeBytes: finalStats.size,
        checksum,
        encrypted,
        status: 'SUCCESS',
        createdById: user.id,
        outletId: user.outletId || null,
      },
    });

    // Send file
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = fs.createReadStream(finalPath);
    stream.pipe(res);

    // Cleanup file after sending
    stream.on('end', () => {
      try { fs.unlinkSync(finalPath); } catch {}
    });
  } catch (error: any) {
    console.error('[backupController] createBackup error:', error);
    // Record failed backup
    try {
      await prisma.backupHistory.create({
        data: {
          filename: `backup-failed-${Date.now()}.sql`,
          type: req.body?.type || 'full',
          label: req.body?.label || 'Failed backup',
          sizeBytes: 0,
          checksum: '',
          encrypted: false,
          status: 'FAILED',
          errorMessage: error?.message || 'Unknown error',
          createdById: (req as AuthRequest).user?.id || 'unknown',
          outletId: (req as AuthRequest).user?.outletId || null,
        },
      });
    } catch {}
    res.status(500).json({ message: 'Backup failed', detail: error?.message });
  }
};

// ── Restore Backup ──
export const restoreBackup = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!isAdminLike(user) || !user) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { filename, password, type } = req.body;
    if (!filename) {
      res.status(400).json({ message: 'Filename is required' });
      return;
    }

    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Backup file not found on server. Upload it first.' });
      return;
    }

    let restorePath = filePath;
    const isEncrypted = filename.endsWith('.enc');

    // Decrypt if needed
    if (isEncrypted) {
      if (!password) {
        res.status(400).json({ message: 'Password required for encrypted backup' });
        return;
      }
      const decPath = filePath + '.dec';
      const decBuf = decryptFile(filePath, password);
      fs.writeFileSync(decPath, decBuf);
      restorePath = decPath;
    }

    const tables = type && type !== 'full' ? TABLE_MAP[type] : undefined;
    await runPgRestore(getDbUrl(), restorePath, tables);

    // Cleanup decrypted temp file
    if (restorePath !== filePath) {
      try { fs.unlinkSync(restorePath); } catch {}
    }

    // Log restore
    await prisma.backupHistory.create({
      data: {
        filename: `restore-${filename}`,
        type: type || 'full',
        label: `Restore from ${filename}`,
        sizeBytes: 0,
        checksum: '',
        encrypted: false,
        status: 'SUCCESS',
        createdById: user.id,
        outletId: user.outletId || null,
      },
    });

    res.json({ message: 'Restore completed successfully', filename, type: type || 'full' });
  } catch (error: any) {
    console.error('[backupController] restoreBackup error:', error);
    res.status(500).json({ message: 'Restore failed', detail: error?.message });
  }
};

// ── Upload Backup File ──
export const uploadBackup = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!isAdminLike(user) || !user) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const uploadedFile = file;
    const filename = `upload-${Date.now()}-${uploadedFile.originalname}`;
    const destPath = path.join(BACKUP_DIR, filename);
    fs.copyFileSync(uploadedFile.path, destPath);
    fs.unlinkSync(uploadedFile.path);

    const stats = fs.statSync(destPath);
    const checksum = generateChecksum(destPath);

    const backup = await prisma.backupHistory.create({
      data: {
        filename,
        type: 'uploaded',
        label: uploadedFile.originalname,
        sizeBytes: stats.size,
        checksum,
        encrypted: filename.endsWith('.enc'),
        status: 'SUCCESS',
        createdById: user.id,
        outletId: (user as any).outletId || null,
      },
    });

    res.json({ message: 'Backup file uploaded', backup });
  } catch (error: any) {
    console.error('[backupController] uploadBackup error:', error);
    res.status(500).json({ message: 'Upload failed', detail: error?.message });
  }
};

// ── List Backups ──
export const listBackups = async (req: Request, res: Response) => {
  try {
    const backups = await prisma.backupHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(backups);
  } catch (error: any) {
    console.error('[backupController] listBackups error:', error);
    res.status(500).json({ message: 'Failed to list backups', detail: error?.message });
  }
};

// ── Delete Backup File ──
export const deleteBackup = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!isAdminLike(user) || !user) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const id = req.params.id as string;
    const backup = await prisma.backupHistory.findUnique({ where: { id } });
    if (!backup) {
      res.status(404).json({ message: 'Backup record not found' });
      return;
    }

    // Delete file if it exists
    const filePath = path.join(BACKUP_DIR, backup.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.backupHistory.delete({ where: { id } });
    res.json({ message: 'Backup deleted' });
  } catch (error: any) {
    console.error('[backupController] deleteBackup error:', error);
    res.status(500).json({ message: 'Failed to delete backup', detail: error?.message });
  }
};

// ── Get Backup Dashboard Stats ──
export const getBackupStats = async (req: Request, res: Response) => {
  try {
    const backups = await prisma.backupHistory.findMany({ orderBy: { createdAt: 'desc' } });
    const lastBackup = backups.find(b => b.status === 'SUCCESS');
    const failedCount = backups.filter(b => b.status === 'FAILED').length;
    const totalSize = backups.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);

    // Count backup files on disk
    let diskFiles = 0;
    let diskSize = 0;
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR);
      diskFiles = files.length;
      diskSize = files.reduce((sum, f) => sum + fs.statSync(path.join(BACKUP_DIR, f)).size, 0);
    }

    res.json({
      totalBackups: backups.length,
      lastBackupDate: lastBackup?.createdAt || null,
      lastBackupStatus: lastBackup?.status || null,
      failedCount,
      totalSizeBytes: totalSize,
      diskFiles,
      diskSizeBytes: diskSize,
    });
  } catch (error: any) {
    console.error('[backupController] getBackupStats error:', error);
    res.status(500).json({ message: 'Failed to get stats', detail: error?.message });
  }
};

// ── Auto-Backup Schedule ──
import { loadSchedule, saveSchedule, calculateNextRun, triggerManualBackup } from '../services/autoBackupService.js';

export const getSchedule = async (req: Request, res: Response) => {
  try {
    const schedule = loadSchedule();
    const nextRun = calculateNextRun(schedule);
    res.json({ ...schedule, nextRun: nextRun?.toISOString() || null });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to get schedule', detail: error?.message });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!isAdminLike(user)) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { enabled, frequency, time, type, encrypt, password, retentionDays } = req.body;
    const current = loadSchedule();
    const schedule = {
      ...current,
      enabled: enabled !== undefined ? enabled : current.enabled,
      frequency: frequency || current.frequency,
      time: time || current.time,
      type: type || current.type,
      encrypt: encrypt !== undefined ? encrypt : current.encrypt,
      password: password || current.password,
      retentionDays: retentionDays !== undefined ? retentionDays : current.retentionDays,
    };

    saveSchedule(schedule);
    const nextRun = calculateNextRun(schedule);
    res.json({ message: 'Schedule updated', ...schedule, nextRun: nextRun?.toISOString() || null });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update schedule', detail: error?.message });
  }
};

export const triggerBackupNow = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!isAdminLike(user)) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const { type } = req.body;
    await triggerManualBackup(type ? { type } : undefined);
    res.json({ message: 'Backup triggered successfully' });
  } catch (error: any) {
    console.error('[backupController] triggerBackupNow error:', error);
    res.status(500).json({ message: 'Backup trigger failed', detail: error?.message });
  }
};
