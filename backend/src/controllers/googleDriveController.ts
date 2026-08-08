import { Request, Response } from 'express';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import prisma from '../db/prisma.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(process.cwd(), 'google-drive-tokens.json');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/google-drive/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function loadSavedTokens(userId: string): any | null {
  try {
    const tokenDir = path.join(process.cwd(), 'tokens');
    const tokenFile = path.join(tokenDir, `${userId}.json`);
    if (fs.existsSync(tokenFile)) {
      return JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
    }
  } catch {}
  return null;
}

function saveTokens(userId: string, tokens: any): void {
  const tokenDir = path.join(process.cwd(), 'tokens');
  if (!fs.existsSync(tokenDir)) fs.mkdirSync(tokenDir, { recursive: true });
  fs.writeFileSync(path.join(tokenDir, `${userId}.json`), JSON.stringify(tokens, null, 2));
}

function removeTokens(userId: string): void {
  try {
    const tokenFile = path.join(process.cwd(), 'tokens', `${userId}.json`);
    if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);
  } catch {}
}

// ── Get Google Drive Auth URL ──
export const getAuthUrl = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      res.status(400).json({
        message: 'Google Drive is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env',
        configured: false,
      });
      return;
    }

    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: user.id,
    });

    res.json({ authUrl, configured: true });
  } catch (error: any) {
    console.error('[googleDrive] getAuthUrl error:', error);
    res.status(500).json({ message: 'Failed to generate auth URL', detail: error?.message });
  }
};

// ── Google OAuth Callback ──
export const handleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state: userId } = req.query;
    if (!code || !userId) {
      res.status(400).send('Missing authorization code');
      return;
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    saveTokens(userId as string, tokens);

    // Redirect back to the frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/app/backup?gdrive=connected`);
  } catch (error: any) {
    console.error('[googleDrive] callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/app/backup?gdrive=error`);
  }
};

// ── Check Connection Status ──
export const getConnectionStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const tokens = loadSavedTokens(user.id);
    const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const connected = !!tokens;

    let email = null;
    if (connected && tokens) {
      try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials(tokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const about = await drive.about.get({ fields: 'user(emailAddress)' });
        email = about.data.user?.emailAddress || null;
      } catch {
        // Token might be expired
      }
    }

    res.json({ configured, connected, email });
  } catch (error: any) {
    console.error('[googleDrive] getStatus error:', error);
    res.status(500).json({ message: 'Failed to check status', detail: error?.message });
  }
};

// ── Disconnect Google Drive ──
export const disconnect = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    removeTokens(user.id);
    res.json({ message: 'Google Drive disconnected' });
  } catch (error: any) {
    console.error('[googleDrive] disconnect error:', error);
    res.status(500).json({ message: 'Failed to disconnect', detail: error?.message });
  }
};

// ── Backup to Google Drive ──
export const backupToDrive = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const tokens = loadSavedTokens(user.id);
    if (!tokens) {
      res.status(400).json({ message: 'Google Drive not connected. Please connect first.' });
      return;
    }

    const { type = 'full', label } = req.body;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const dbUrl = process.env.DATABASE_URL || '';
    const dbMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!dbMatch) {
      res.status(500).json({ message: 'Invalid DATABASE_URL' });
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `restobyte-backup-${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    // Run pg_dump
    const cmd = `pg_dump -h ${dbMatch[3]} -p ${dbMatch[4]} -U ${dbMatch[1]} -d ${(dbMatch[5] || '').split('?')[0]} --no-owner --no-acl -F c -f "${filePath}"`;
    await execAsync(cmd, { env: { ...process.env, PGPASSWORD: dbMatch[2] }, maxBuffer: 50 * 1024 * 1024 });

    const stats = fs.statSync(filePath);

    // Upload to Google Drive
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Find or create a RestoByte Backups folder
    const folderQuery = "name='RestoByte Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false";
    const folderRes = await drive.files.list({ q: folderQuery, fields: 'files(id)' });
    let folderId = folderRes.data.files?.[0]?.id;

    if (!folderId) {
      const folder = await drive.files.create({
        requestBody: { name: 'RestoByte Backups', mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      });
      folderId = folder.data.id || undefined;
    }

    // Upload the backup file
    const fileMetadata = {
      name: filename,
      parents: folderId ? [folderId] : [],
    };
    const media = {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(filePath),
    };

    const uploaded = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, size, createdTime',
    });

    // Record in BackupHistory
    await prisma.backupHistory.create({
      data: {
        filename: `gdrive-${filename}`,
        type,
        label: label || `Google Drive backup`,
        sizeBytes: stats.size,
        checksum: '',
        encrypted: false,
        status: 'SUCCESS',
        createdById: user.id,
        outletId: user.outletId || null,
      },
    });

    // Cleanup local file
    try { fs.unlinkSync(filePath); } catch {}

    res.json({
      message: 'Backup uploaded to Google Drive',
      fileId: uploaded.data.id,
      fileName: uploaded.data.name,
      size: uploaded.data.size,
      createdTime: uploaded.data.createdTime,
    });
  } catch (error: any) {
    console.error('[googleDrive] backup error:', error);
    res.status(500).json({ message: 'Backup to Google Drive failed', detail: error?.message });
  }
};

// ── List backups on Google Drive ──
export const listDriveBackups = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const tokens = loadSavedTokens(user.id);
    if (!tokens) {
      res.status(400).json({ message: 'Google Drive not connected' });
      return;
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const query = "name contains 'restobyte-backup-' and trashed=false";
    const result = await drive.files.list({
      q: query,
      fields: 'files(id, name, size, createdTime, mimeType)',
      orderBy: 'createdTime desc',
      pageSize: 50,
    });

    res.json(result.data.files || []);
  } catch (error: any) {
    console.error('[googleDrive] listBackups error:', error);
    res.status(500).json({ message: 'Failed to list backups', detail: error?.message });
  }
};

// ── Restore from Google Drive ──
export const restoreFromDrive = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    if (!user.isSuperAdmin && user.roleId !== 'role-admin') {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const tokens = loadSavedTokens(user.id);
    if (!tokens) {
      res.status(400).json({ message: 'Google Drive not connected' });
      return;
    }

    const { fileId, type } = req.body;
    if (!fileId) {
      res.status(400).json({ message: 'File ID is required' });
      return;
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Download the file
    const tempPath = path.join(BACKUP_DIR, `gdrive-restore-${Date.now()}.sql`);
    const dest = fs.createWriteStream(tempPath);

    const res2 = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    await new Promise<void>((resolve, reject) => {
      res2.data.pipe(dest);
      dest.on('finish', resolve);
      dest.on('error', reject);
    });

    // Restore using pg_restore
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const dbUrl = process.env.DATABASE_URL || '';
    const dbMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!dbMatch) throw new Error('Invalid DATABASE_URL');

    const cmd = `pg_restore -h ${dbMatch[3]} -p ${dbMatch[4]} -U ${dbMatch[1]} -d ${(dbMatch[5] || '').split('?')[0]} --no-owner --no-acl --clean --if-exists "${tempPath}"`;
    await execAsync(cmd, { env: { ...process.env, PGPASSWORD: dbMatch[2] }, maxBuffer: 50 * 1024 * 1024 });

    // Cleanup
    try { fs.unlinkSync(tempPath); } catch {}

    // Log restore
    await prisma.backupHistory.create({
      data: {
        filename: `gdrive-restore-${fileId}`,
        type: type || 'full',
        label: `Restore from Google Drive`,
        sizeBytes: 0,
        checksum: '',
        encrypted: false,
        status: 'SUCCESS',
        createdById: user.id,
        outletId: user.outletId || null,
      },
    });

    res.json({ message: 'Restore from Google Drive completed successfully' });
  } catch (error: any) {
    console.error('[googleDrive] restore error:', error);
    res.status(500).json({ message: 'Restore from Google Drive failed', detail: error?.message });
  }
};

// ── Delete backup from Google Drive ──
export const deleteDriveBackup = async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const tokens = loadSavedTokens(user.id);
    if (!tokens) {
      res.status(400).json({ message: 'Google Drive not connected' });
      return;
    }

    const fileId = req.params.fileId as string;
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    await drive.files.delete({ fileId });
    res.json({ message: 'Backup deleted from Google Drive' });
  } catch (error: any) {
    console.error('[googleDrive] delete error:', error);
    res.status(500).json({ message: 'Failed to delete backup', detail: error?.message });
  }
};
