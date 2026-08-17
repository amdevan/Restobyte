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

// ── Configurable Paths ──
function resolveBackupDir(): string {
  const raw = process.env.BACKUP_DIR;
  if (raw && raw.trim()) {
    return path.isAbsolute(raw.trim())
      ? raw.trim()
      : path.resolve(process.cwd(), raw.trim());
  }
  return path.resolve(process.cwd(), 'backups');
}

const BACKUP_DIR = resolveBackupDir();
const ACTIVITY_LOG_FILE = path.join(BACKUP_DIR, 'backup-activity.log');
const ALGORITHM = 'aes-256-gcm';

// ── Directory / Permissions helpers ──
function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o755 });
  } else {
    try { fs.chmodSync(BACKUP_DIR, 0o755); } catch { /* ignore */ }
  }
}

function setFilePermissions(filePath: string, mode: number = 0o644): void {
  try { fs.chmodSync(filePath, mode); } catch { /* ignore */ }
}

// Ensure dir on module load
ensureBackupDir();

// ── Activity Audit Log ──
function logActivity(message: string, meta?: Record<string, unknown>): void {
  try {
    ensureBackupDir();
    const ts = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    const line = `[${ts}] ${message}${metaStr}\n`;
    fs.appendFileSync(ACTIVITY_LOG_FILE, line, { mode: 0o644 });
    console.warn(`[backup-audit] ${message}${metaStr}`);
  } catch {
    console.warn('[backup-audit] Failed to write activity log:', message);
  }
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
  setFilePermissions(outputPath, 0o644);
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

// ── Validate uploaded / selected backup ──
// For JSON backups we ensure parseable JSON; for pg_dump custom/SQL we verify non-empty
// and run a quick `pg_restore --list` TOC sanity check if possible.
async function validateBackupFile(filePath: string): Promise<{ ok: boolean; format: 'json' | 'pgdump' | 'unknown'; error?: string }> {
  if (!fs.existsSync(filePath)) {
    return { ok: false, format: 'unknown', error: 'File does not exist' };
  }
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    return { ok: false, format: 'unknown', error: 'File is empty' };
  }
  // Try JSON parse first (for app-level JSON backups)
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    JSON.parse(raw);
    return { ok: true, format: 'json' };
  } catch { /* not JSON, try pg_dump validation below */ }

  // Try pg_restore --list to validate custom/SQL dump
  try {
    const dbUrl = getDbUrl();
    const db = parseDbUrl(dbUrl);
    const checkCmd = `pg_restore -h ${db.host} -p ${db.port} -U ${db.user} --list "${filePath}" 2>&1 | head -n 5`;
    await execAsync(checkCmd, { env: { ...process.env, PGPASSWORD: db.password }, timeout: 15000 });
    return { ok: true, format: 'pgdump' };
  } catch {
    // pg_restore might fail on SQL files but it's still usable.
    // Check magic bytes header to determine if it looks like a pg_dump file.
    try {
      const fd = fs.openSync(filePath, 'r');
      const buf = Buffer.alloc(16);
      fs.readSync(fd, buf, 0, 16, 0);
      fs.closeSync(fd);
      const header = buf.toString('utf8', 0, 5);
      const looksLikePg = header.startsWith('PGDMP') || header.includes('COPY') || header.includes('CREATE');
      if (looksLikePg || stats.size > 1024) {
        return { ok: true, format: 'pgdump' };
      }
      return { ok: false, format: 'unknown', error: 'Unrecognized backup file format' };
    } catch (e: any) {
      return { ok: false, format: 'unknown', error: e?.message || 'Validation failed' };
    }
  }
}

async function runPgDump(dbUrl: string, outputPath: string, tables?: string[]): Promise<void> {
  // Check if pg_dump is available
  try {
    await execAsync('which pg_dump', { timeout: 5000 });
  } catch {
    throw new Error('pg_dump is not installed on this server. Backup feature requires postgresql-client. Please install it or use the Dockerfile deployment instead of nixpacks.');
  }
  ensureBackupDir();
  const db = parseDbUrl(dbUrl);
  let cmd = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} --no-owner --no-acl -F c`;
  if (tables && tables.length > 0) {
    for (const t of tables) cmd += ` -t ${t}`;
  }
  cmd += ` -f "${outputPath}"`;
  await execAsync(cmd, { env: { ...process.env, PGPASSWORD: db.password }, maxBuffer: 50 * 1024 * 1024 });
  setFilePermissions(outputPath, 0o644);
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
    ensureBackupDir();
    const filePath = path.join(BACKUP_DIR, filename);
    const dbUrl = getDbUrl();
    const tables = type === 'full' ? undefined : TABLE_MAP[type];

    if (type !== 'full' && !tables) {
      res.status(400).json({ message: `Invalid backup type: ${type}` });
      return;
    }

    logActivity('BACKUP_START', { userId: user.id, type, label, filename });

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
    setFilePermissions(finalPath, 0o644);

    // Save to database in a transaction
    const backup = await prisma.$transaction(async (tx) => {
      return tx.backupHistory.create({
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
    });

    logActivity('BACKUP_SUCCESS', { userId: user.id, backupId: backup.id, filename: finalFilename, sizeBytes: finalStats.size, encrypted });

    // Send file — correct headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    res.setHeader('Content-Type', encrypted
      ? 'application/octet-stream'
      : 'application/octet-stream');
    res.setHeader('Content-Length', String(finalStats.size));
    const stream = fs.createReadStream(finalPath);
    stream.pipe(res);

    // Cleanup file after sending
    stream.on('end', () => {
      try { fs.unlinkSync(finalPath); } catch {}
    });
  } catch (error: any) {
    console.error('[backupController] createBackup error:', error);
    logActivity('BACKUP_FAILED', { userId: (req as AuthRequest).user?.id || 'unknown', error: error?.message || 'Unknown error' });
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

    const { filename, password, type, confirmRestore } = req.body;

    // ── Validation 1: Explicit confirmation flag ──
    if (confirmRestore !== true) {
      res.status(400).json({ message: 'Restore confirmation required' });
      return;
    }

    if (!filename) {
      res.status(400).json({ message: 'Filename is required' });
      return;
    }

    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Backup file not found on server. Upload it first.' });
      return;
    }

    // ── Validation 2: File is valid backup (JSON or pg_dump) ──
    const validation = await validateBackupFile(filePath);
    if (!validation.ok) {
      res.status(400).json({ message: 'Invalid backup file', detail: validation.error });
      return;
    }

    // ── Capture identity BEFORE restore for tenant/outlet match check ──
    const preTenantId: string | undefined = user.tenantId ? String(user.tenantId) : undefined;
    const preOutletId: string | undefined = user.outletId ? String(user.outletId) : undefined;

    logActivity('RESTORE_START', {
      userId: user.id,
      filename,
      type: type || 'full',
      format: validation.format,
      preTenantId,
      preOutletId,
    });

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
      setFilePermissions(decPath, 0o644);
      restorePath = decPath;

      // Decrypted file also needs to validate
      const decValidation = await validateBackupFile(decPath);
      if (!decValidation.ok) {
        try { fs.unlinkSync(decPath); } catch {}
        res.status(400).json({ message: 'Decrypted backup failed validation (wrong password or corrupt file)', detail: decValidation.error });
        return;
      }
    }

    const tables = type && type !== 'full' ? TABLE_MAP[type] : undefined;

    // ── Tenant/Outlet match: Snapshot existing IDs before destructive restore ──
    const beforeSnapshot = await prisma.$transaction(async (tx) => {
      const tenants = await tx.tenant.findMany({ select: { id: true } }).catch(() => [] as any[]);
      const outlets = await tx.outlet.findMany({ select: { id: true } }).catch(() => [] as any[]);
      return {
        tenants: tenants.map((t: any) => String(t.id)),
        outlets: outlets.map((o: any) => String(o.id)),
      };
    });

    // Perform the pg_restore (external process that modifies DB directly)
    await runPgRestore(getDbUrl(), restorePath, tables);

    // Cleanup decrypted temp file
    if (restorePath !== filePath) {
      try { fs.unlinkSync(restorePath); } catch {}
    }

    // ── After restore + before commit: tenant/outlet match check ──
    // For partial restores we skip this check (only full restores could cross tenants).
    let tenantMismatch = false;
    let outletMismatch = false;
    let mismatchDetail: string | undefined;

    if (!tables || type === 'full' || type === undefined) {
      const afterSnapshot = await prisma.$transaction(async (tx) => {
        const tenants = await tx.tenant.findMany({ select: { id: true } }).catch(() => [] as any[]);
        const outlets = await tx.outlet.findMany({ select: { id: true } }).catch(() => [] as any[]);
        return {
          tenants: tenants.map((t: any) => String(t.id)),
          outlets: outlets.map((o: any) => String(o.id)),
        };
      });

      // If the user was bound to a specific tenant, at least one of their tenants must still exist.
      if (preTenantId && afterSnapshot.tenants.length > 0) {
        if (!afterSnapshot.tenants.includes(preTenantId)) {
          tenantMismatch = true;
        }
      }
      if (preOutletId && afterSnapshot.outlets.length > 0) {
        if (!afterSnapshot.outlets.includes(preOutletId)) {
          outletMismatch = true;
        }
      }

      if (tenantMismatch || outletMismatch) {
        mismatchDetail = `Tenant or Outlet mismatch after restore. Expected tenant=${preTenantId}, outlet=${preOutletId}; after restore tenants=${afterSnapshot.tenants.join(',')}, outlets=${afterSnapshot.outlets.join(',')}. Restore still applied — please verify data.`;
        logActivity('RESTORE_MISMATCH_WARNING', {
          userId: user.id,
          filename,
          beforeTenants: beforeSnapshot.tenants,
          afterTenants: afterSnapshot.tenants,
          beforeOutlets: beforeSnapshot.outlets,
          afterOutlets: afterSnapshot.outlets,
        });
      }
    }

    // ── Wrap Prisma logging in a transaction ──
    const logRecord = await prisma.$transaction(async (tx) => {
      return tx.backupHistory.create({
        data: {
          filename: `restore-${filename}`,
          type: type || 'full',
          label: mismatchDetail
            ? `Restore from ${filename} — TENANT/OUTLET MISMATCH WARNING`
            : `Restore from ${filename}`,
          sizeBytes: 0,
          checksum: '',
          encrypted: false,
          status: mismatchDetail ? 'SUCCESS_WITH_WARNING' : 'SUCCESS',
          errorMessage: mismatchDetail || null,
          createdById: user.id,
          outletId: user.outletId || null,
        },
      });
    });

    logActivity('RESTORE_SUCCESS', {
      userId: user.id,
      logRecordId: logRecord.id,
      filename,
      type: type || 'full',
      tenantMismatch,
      outletMismatch,
    });

    res.json({
      message: mismatchDetail
        ? `Restore completed with warning: ${mismatchDetail}`
        : 'Restore completed successfully',
      filename,
      type: type || 'full',
      warnings: mismatchDetail ? [mismatchDetail] : [],
    });
  } catch (error: any) {
    console.error('[backupController] restoreBackup error:', error);
    logActivity('RESTORE_FAILED', { userId: (req as AuthRequest).user?.id || 'unknown', filename: req.body?.filename, error: error?.message || 'Unknown error' });
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

    ensureBackupDir();
    const uploadedFile = file;
    const filename = `upload-${Date.now()}-${uploadedFile.originalname}`;
    const destPath = path.join(BACKUP_DIR, filename);
    fs.copyFileSync(uploadedFile.path, destPath);
    fs.unlinkSync(uploadedFile.path);
    setFilePermissions(destPath, 0o644);

    // Quick validation of the uploaded file — if it fails, still allow storage but mark
    const validation = await validateBackupFile(destPath).catch(() => ({ ok: false as const, format: 'unknown' as const, error: 'Validation crashed' }));

    const stats = fs.statSync(destPath);
    const checksum = generateChecksum(destPath);

    const backup = await prisma.$transaction(async (tx) => {
      return tx.backupHistory.create({
        data: {
          filename,
          type: 'uploaded',
          label: uploadedFile.originalname,
          sizeBytes: stats.size,
          checksum,
          encrypted: filename.endsWith('.enc'),
          status: validation.ok ? 'SUCCESS' : 'SUCCESS_WITH_WARNING',
          errorMessage: validation.ok ? null : (validation.error || 'Uploaded file could not be auto-validated — please confirm before restore'),
          createdById: user.id,
          outletId: (user as any).outletId || null,
        },
      });
    });

    logActivity('UPLOAD_SUCCESS', { userId: user.id, filename, originalName: uploadedFile.originalname, sizeBytes: stats.size, valid: validation.ok });

    res.json({ message: 'Backup file uploaded', backup, validation: validation.ok ? 'ok' : 'warning' });
  } catch (error: any) {
    console.error('[backupController] uploadBackup error:', error);
    logActivity('UPLOAD_FAILED', { userId: (req as AuthRequest).user?.id || 'unknown', error: error?.message || 'Unknown error' });
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

    await prisma.$transaction(async (tx) => {
      await tx.backupHistory.delete({ where: { id } });
    });

    logActivity('DELETE_SUCCESS', { userId: user.id, backupId: id, filename: backup.filename });

    res.json({ message: 'Backup deleted' });
  } catch (error: any) {
    console.error('[backupController] deleteBackup error:', error);
    logActivity('DELETE_FAILED', { userId: (req as AuthRequest).user?.id || 'unknown', backupId: req.params?.id, error: error?.message || 'Unknown error' });
    res.status(500).json({ message: 'Failed to delete backup', detail: error?.message });
  }
};

// ── Get Backup Dashboard Stats ──
export const getBackupStats = async (req: Request, res: Response) => {
  try {
    const backups = await prisma.backupHistory.findMany({ orderBy: { createdAt: 'desc' } });
    const lastBackup = backups.find(b => b.status === 'SUCCESS' || b.status === 'SUCCESS_WITH_WARNING');
    const failedCount = backups.filter(b => b.status === 'FAILED').length;
    const totalSize = backups.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);

    // Count backup files on disk
    let diskFiles = 0;
    let diskSize = 0;
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR).filter(f => f !== 'backup-activity.log');
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
      backupDir: BACKUP_DIR,
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
    res.json({ ...schedule, nextRun: nextRun?.toISOString() || null, backupDir: BACKUP_DIR });
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
    logActivity('SCHEDULE_UPDATED', { userId: user?.id || 'unknown', enabled: schedule.enabled, frequency: schedule.frequency, time: schedule.time, retentionDays: schedule.retentionDays });
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
    logActivity('MANUAL_TRIGGER', { userId: user?.id || 'unknown', type: type || 'default' });
    await triggerManualBackup(type ? { type } : undefined);
    res.json({ message: 'Backup triggered successfully' });
  } catch (error: any) {
    console.error('[backupController] triggerBackupNow error:', error);
    logActivity('MANUAL_TRIGGER_FAILED', { userId: (req as AuthRequest).user?.id || 'unknown', error: error?.message || 'Unknown error' });
    res.status(500).json({ message: 'Backup trigger failed', detail: error?.message });
  }
};
