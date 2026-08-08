import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import prisma from '../db/prisma.js';

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const SCHEDULE_FILE = path.join(process.cwd(), 'backup-schedule.json');

export interface BackupSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM (24h)
  type: string; // full, sales, products, etc.
  encrypt: boolean;
  password?: string;
  retentionDays: number; // auto-delete backups older than this
  lastRun?: string;
  nextRun?: string;
}

const DEFAULT_SCHEDULE: BackupSchedule = {
  enabled: false,
  frequency: 'daily',
  time: '02:00',
  type: 'full',
  encrypt: false,
  retentionDays: 30,
};

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

// ── Schedule Config ──
export function loadSchedule(): BackupSchedule {
  try {
    if (fs.existsSync(SCHEDULE_FILE)) {
      return { ...DEFAULT_SCHEDULE, ...JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8')) };
    }
  } catch {}
  return { ...DEFAULT_SCHEDULE };
}

export function saveSchedule(schedule: BackupSchedule): void {
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
  // Restart scheduler with new config
  stopScheduler();
  if (schedule.enabled) startScheduler();
}

function parseDbUrl(url: string) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Invalid DATABASE_URL');
  return { user: match[1], password: match[2], host: match[3], port: match[4], database: (match[5] || '').split('?')[0] };
}

// ── Run Backup ──
async function runAutoBackup(schedule: BackupSchedule): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `auto-backup-${schedule.type}-${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const dbUrl = process.env.DATABASE_URL || '';
  const db = parseDbUrl(dbUrl);

  // Run pg_dump
  const cmd = `pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} --no-owner --no-acl -F c -f "${filePath}"`;
  await execAsync(cmd, { env: { ...process.env, PGPASSWORD: db.password }, maxBuffer: 50 * 1024 * 1024 });

  const stats = fs.statSync(filePath);
  const checksum = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

  // Record in database
  await prisma.backupHistory.create({
    data: {
      filename,
      type: schedule.type,
      label: `Auto backup (${schedule.frequency})`,
      sizeBytes: stats.size,
      checksum,
      encrypted: schedule.encrypt,
      status: 'SUCCESS',
      createdById: 'system-auto',
    },
  });

  console.log(`[autoBackup] Completed: ${filename} (${stats.size} bytes)`);

  // Cleanup old backups based on retention
  await cleanupOldBackups(schedule.retentionDays);
}

// ── Cleanup Old Backups ──
async function cleanupOldBackups(retentionDays: number): Promise<void> {
  if (retentionDays <= 0) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const oldBackups = await prisma.backupHistory.findMany({
    where: { createdAt: { lt: cutoff }, status: 'SUCCESS' },
  });

  for (const backup of oldBackups) {
    const filePath = path.join(BACKUP_DIR, backup.filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
    await prisma.backupHistory.delete({ where: { id: backup.id } });
  }

  if (oldBackups.length > 0) {
    console.log(`[autoBackup] Cleaned up ${oldBackups.length} old backups (retention: ${retentionDays} days)`);
  }
}

// ── Calculate Next Run Time ──
export function calculateNextRun(schedule: BackupSchedule): Date | null {
  if (!schedule.enabled) return null;

  const parts = schedule.time.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (schedule.frequency === 'daily') {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (schedule.frequency === 'weekly') {
    // Next occurrence of this time on a Sunday (day 0)
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    next.setDate(next.getDate() + daysUntilSunday);
    if (next <= now) next.setDate(next.getDate() + 7);
  } else if (schedule.frequency === 'monthly') {
    next.setDate(1); // First of month
    if (next <= now) next.setMonth(next.getMonth() + 1);
  }

  return next;
}

// ── Check and Run if Due ──
function checkAndRun(schedule: BackupSchedule): void {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);

  const isTimeMatch = now.getHours() === hours && now.getMinutes() === minutes;
  if (!isTimeMatch) return;

  // Check if we already ran today
  const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : null;
  if (lastRun) {
    const lastRunDay = lastRun.toDateString();
    const today = now.toDateString();

    if (schedule.frequency === 'daily' && lastRunDay === today) return;
    if (schedule.frequency === 'weekly' && lastRunDay === today) return;
    if (schedule.frequency === 'monthly' && lastRun.getMonth() === now.getMonth() && lastRun.getFullYear() === now.getFullYear()) return;
  }

  // Run the backup
  console.log(`[autoBackup] Running scheduled ${schedule.frequency} backup...`);
  runAutoBackup(schedule)
    .then(() => {
      // Update last run
      const updated = { ...schedule, lastRun: now.toISOString(), nextRun: calculateNextRun(schedule)?.toISOString() || '' };
      saveSchedule(updated);
    })
    .catch(err => {
      console.error('[autoBackup] Backup failed:', err);
      // Record failed backup
      prisma.backupHistory.create({
        data: {
          filename: `auto-backup-failed-${Date.now()}.sql`,
          type: schedule.type,
          label: `Auto backup failed (${schedule.frequency})`,
          sizeBytes: 0,
          checksum: '',
          encrypted: false,
          status: 'FAILED',
          errorMessage: err?.message || 'Unknown error',
          createdById: 'system-auto',
        },
      }).catch(() => {});
    });
}

// ── Start Scheduler ──
export function startScheduler(): void {
  if (schedulerInterval) return;

  const schedule = loadSchedule();
  if (!schedule.enabled) return;

  // Check every minute
  schedulerInterval = setInterval(() => {
    const currentSchedule = loadSchedule();
    if (currentSchedule.enabled) {
      checkAndRun(currentSchedule);
    }
  }, 60 * 1000); // 1 minute

  console.log(`[autoBackup] Scheduler started — ${schedule.frequency} at ${schedule.time}`);
}

// ── Stop Scheduler ──
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[autoBackup] Scheduler stopped');
  }
}

// ── Manual Trigger ──
export async function triggerManualBackup(schedule?: Partial<BackupSchedule>): Promise<void> {
  const current = loadSchedule();
  const config = { ...current, ...schedule };
  await runAutoBackup(config);
}
